// src/lib/sheetOcr.ts
//
// Transcrição dos nomes manuscritos de uma lista de presença fotografada.
// Usa o Gemini Flash (camada gratuita do Google AI Studio), configurado por
// GOOGLE_AI_API_KEY. O modelo pode ser trocado por GOOGLE_AI_MODEL.

export type ReadName = { name: string; legible: boolean }

export type OcrProvider = "gemini"

export class OcrConfigError extends Error {}
export class OcrRefusalError extends Error {}

export const ACCEPTED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export type AcceptedMediaType = (typeof ACCEPTED_MEDIA_TYPES)[number]

const SYSTEM_PROMPT = `Você lê listas de presença manuscritas de uma igreja brasileira e extrai os nomes.

Regras:
- Extraia apenas os nomes das linhas preenchidas à mão. Ignore cabeçalho, título, data, referência bíblica, logotipo, numeração das linhas e linhas em branco.
- Devolva cada nome exatamente na ordem em que aparece na folha.
- Transcreva o que está escrito. Não invente sobrenomes, não complete nomes e não corrija para nomes que você acha mais prováveis.
- Nomes brasileiros: mantenha a grafia com acentos quando conseguir distingui-la.
- Se uma linha estiver preenchida mas a letra for ilegível, devolva sua melhor tentativa com legible=false em vez de omitir a linha.
- Não devolva linhas vazias.`

const USER_PROMPT = "Extraia os nomes manuscritos desta lista de presença."

/** A leitura por foto está configurada? */
export function resolveProvider(): OcrProvider | null {
  return process.env.GOOGLE_AI_API_KEY ? "gemini" : null
}

/** Descarta entradas vazias e normaliza o formato vindo do modelo. */
function cleanNames(raw: unknown): ReadName[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((n) => ({
      name: typeof n?.name === "string" ? n.name.trim() : "",
      legible: n?.legible !== false,
    }))
    .filter((n) => n.name.length > 0)
}

// ── Gemini ──────────────────────────────────────────────────────────────────
// Chamado via REST para não precisar de mais uma dependência.

const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    names: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "O nome como está escrito na folha." },
          legible: { type: "BOOLEAN", description: "false quando a letra é ilegível demais." },
        },
        required: ["name", "legible"],
      },
    },
  },
  required: ["names"],
}

async function readWithGemini(
  imageBase64: string,
  mediaType: AcceptedMediaType,
): Promise<ReadName[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new OcrConfigError("GOOGLE_AI_API_KEY não definida.")

  // Apelido que acompanha a versão atual do Flash — modelos com número fixo
  // saem do ar para contas novas ("no longer available to new users").
  // Não use as variantes "lite": em teste, elas inventaram nomes a partir de
  // uma imagem sem texto nenhum.
  const model = process.env.GOOGLE_AI_MODEL || "gemini-flash-latest"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: mediaType, data: imageBase64 } },
            { text: USER_PROMPT },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: GEMINI_SCHEMA,
      },
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    if (res.status === 429) {
      throw new Error("Limite gratuito do Gemini atingido. Tente de novo em alguns minutos.")
    }
    if (res.status === 400 && detail.includes("API key")) {
      throw new OcrConfigError("Chave do Google AI inválida.")
    }
    if (res.status === 404) {
      throw new OcrConfigError(
        `O modelo "${model}" não está disponível para esta chave. Ajuste GOOGLE_AI_MODEL no servidor.`,
      )
    }
    throw new Error(`Gemini respondeu ${res.status}.`)
  }

  const data = await res.json()
  const candidate = data?.candidates?.[0]

  if (candidate?.finishReason === "SAFETY" || candidate?.finishReason === "PROHIBITED_CONTENT") {
    throw new OcrRefusalError("A leitura desta imagem foi recusada.")
  }

  const text = candidate?.content?.parts?.map((p: any) => p?.text ?? "").join("") ?? ""
  if (!text.trim()) throw new Error("Resposta vazia na leitura.")

  return cleanNames(JSON.parse(text).names)
}

/** Lê os nomes manuscritos usando o provedor configurado. */
export async function readSheetNames(
  imageBase64: string,
  mediaType: AcceptedMediaType,
): Promise<{ names: ReadName[]; provider: OcrProvider }> {
  const provider = resolveProvider()
  if (!provider) {
    throw new OcrConfigError(
      "Leitura por foto não configurada. Defina GOOGLE_AI_API_KEY no servidor.",
    )
  }

  return { names: await readWithGemini(imageBase64, mediaType), provider }
}

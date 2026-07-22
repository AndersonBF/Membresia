// scripts/seed-sermon.mjs
// Insere sermões de EXEMPLO (completos) para visualizar a tela /pastor/sermoes.
// Como o sermão é privado por autor, ele é criado com o seu userId do Clerk.
//
// Uso:
//   node scripts/seed-sermon.mjs                 → para o(s) superadmin(s), no DATABASE_URL
//   node scripts/seed-sermon.mjs <username>      → para um usuário específico
//   TENANT=igreja node scripts/seed-sermon.mjs   → grava no banco daquele tenant
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { createClerkClient } from "@clerk/backend"

const targetUsername = process.argv[2] ?? null
const tenant = process.env.TENANT
const dbUrl = tenant ? process.env[`TENANT_DB__${tenant}`] : process.env.DATABASE_URL

if (!dbUrl) {
  console.error(tenant ? `TENANT_DB__${tenant} não definido.` : "DATABASE_URL não definido.")
  process.exit(1)
}
if (!process.env.CLERK_SECRET_KEY) {
  console.error("CLERK_SECRET_KEY não definido.")
  process.exit(1)
}

const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } })
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

const b = (type, text) => ({ id: Math.random().toString(36).slice(2, 9), type, text })

// ─────────────────────────────────────────────────────────────
// SERMÃO COMPLETO (manuscrito)
// ─────────────────────────────────────────────────────────────
const sermaoAtual = {
  title: "O mesmo ontem, hoje e eternamente",
  passage: "Hebreus 13:8",
  status: "rascunho",
  blocks: [
    b("introducao", `Todos nós já sentimos o chão se mover debaixo dos pés. Às vezes acontece de um jeito barulhento: um diagnóstico que ninguém esperava, um emprego que terminou numa conversa de dez minutos, um casamento que se desfez depois de anos. Outras vezes é silencioso — você simplesmente percebe que a vida não é mais aquela, que as pessoas da sua mesa de domingo já não estão todas ali, que a cidade mudou, que você mudou.

A carta aos Hebreus foi escrita para pessoas exatamente assim. Não para cristãos entusiasmados no primeiro amor, mas para uma comunidade cansada. Gente que já tinha sofrido perseguição, que tinha visto seus bens confiscados (Hebreus 10:34), e que agora estava tentada a recuar — a voltar para o que era antigo, conhecido, seguro. O autor escreve para segurá-los.

E aí, quase no fim da carta, no meio de instruções bem práticas sobre hospitalidade, casamento e dinheiro, ele coloca uma frase curta, que soa como alguém abrindo uma janela num quarto abafado: "Jesus Cristo é o mesmo, ontem, e hoje, e eternamente."

Repare onde ela está. O versículo anterior fala dos líderes que já partiram: "Lembrai-vos dos vossos guias, os quais vos falaram a palavra de Deus" (Hebreus 13:7). O versículo seguinte adverte: "Não vos deixeis levar por doutrinas várias e estranhas" (Hebreus 13:9). Ou seja, de um lado, pessoas que morrem. Do outro, ensinos que aparecem e desaparecem. E entre os dois, como uma coluna que sustenta o teto: Cristo, que não muda.

Esta manhã eu quero que a gente olhe para três coisas que não mudam em Jesus — o seu caráter, a sua obra e a sua promessa — e depois pergunte o que isso significa para a nossa segunda-feira.`),

    b("ponto", `CRISTO NÃO MUDA NO SEU CARÁTER.

A primeira coisa que a Escritura afirma é que Deus não muda naquilo que Ele é. Malaquias 3:6 diz de modo direto: "Porque eu, o Senhor, não mudo; por isso vós, ó filhos de Jacó, não sois consumidos." Note o argumento: a permanência de Deus é a razão pela qual o povo não é destruído. Se Deus oscilasse como nós, ninguém sobreviveria à sua própria inconstância.

Tiago 1:17 fala do "Pai das luzes, em quem não há mudança nem sombra de variação". A imagem é astronômica: os corpos celestes se movem, projetam sombras, mudam de posição. Deus, não. Ele não tem fase, não tem lado escuro, não tem um dia pior.

E é importante dizer o que a imutabilidade não é. Ela não é frieza. Não estamos falando de um Deus de pedra, indiferente ao que acontece com você. Os Evangelhos nos mostram um Cristo que chorou diante do túmulo de Lázaro, que se compadeceu da multidão, que tocou o leproso quando ninguém tocava. A imutabilidade não anula a compaixão — ela a garante. Justamente porque Ele não muda, aquela compaixão que Ele teve pelo leproso Ele tem por você hoje.

Deixe-me colocar de outro jeito. Muitos de nós crescemos aprendendo a ler o humor das pessoas antes de nos aproximarmos. A gente aprende a sentir se hoje é um bom dia para pedir alguma coisa ao pai, ao chefe, ao cônjuge. E aí levamos esse hábito para a oração: ficamos tentando adivinhar em que humor Deus está. Irmãos, não existe um Jesus mais severo na quarta-feira. Não existe um dia em que a porta esteja mais fechada. "Cheguemos, pois, com confiança ao trono da graça" (Hebreus 4:16) — e o "pois" está ali porque o nosso Sumo Sacerdote não muda.`),

    b("ilustracao", `Pense numa igreja antiga aqui da cidade. As pessoas que ergueram aquele prédio já se foram — algumas há sessenta, setenta anos. Os bancos foram trocados pelo menos duas vezes. O telhado foi refeito, a pintura mudou de cor, o som foi modernizado, e a placa da fachada já teve três tipografias diferentes.

Mas debaixo de tudo aquilo existe uma rocha, um alicerce que ninguém vê. Nenhum visitante entra e comenta sobre o alicerce. Não se tira foto do alicerce. E, no entanto, é exatamente ele que sustenta cada coisa visível — inclusive as que foram trocadas.

É assim com Cristo na vida da igreja e na sua vida. Muita coisa que você vê vai mudar. O que sustenta, não.`),

    b("ponto", `CRISTO NÃO MUDA NA SUA OBRA.

A segunda coisa é que aquilo que Ele fez não perde a validade com o tempo. Hebreus é a carta que mais insiste nisso: "tendo oferecido para sempre um único sacrifício pelos pecados, assentou-se à destra de Deus" (Hebreus 10:12). E logo adiante: "com uma única oferta, aperfeiçoou para sempre os que estão sendo santificados" (Hebreus 10:14).

Duas expressões precisam ficar coladas em nós: "um único" e "para sempre". A obra da cruz não é renovável, não é parcelada, não precisa de complemento. Ela não envelhece. O perdão que você recebeu no dia em que creu não é uma versão antiga que já expirou.

E é aqui que o contexto imediato faz todo sentido. Por que o versículo seguinte adverte contra "doutrinas várias e estranhas"? Porque toda vez que a obra de Cristo parece insuficiente ao coração humano, aparece alguém vendendo um acréscimo. Na época, eram regras sobre alimentos. Hoje, as roupagens mudaram, mas a lógica é a mesma: uma experiência a mais, um método a mais, um esforço a mais — e a graça vira apenas o ponto de partida.

Irmãos, não há acréscimo. A carta diz que "é bom que o coração se fortaleça com a graça, e não com alimentos" (Hebreus 13:9). O que fortalece o coração é sempre a mesma graça, e não o que somamos a ela.

Isso tem uma consequência muito prática para a consciência. Quando você peca na terça-feira, a pergunta não é "será que ainda dá?". A obra não mudou entre domingo e terça. Você volta ao mesmo Cristo, com o mesmo sangue, no mesmo trono.`),

    b("ponto", `CRISTO NÃO MUDA NA SUA PROMESSA.

A terceira coisa é que Ele permanece quando tudo mais acaba. O autor de Hebreus, logo no capítulo 1, aplica a Cristo um salmo que falava do próprio Deus. Salmos 102:27 diz: "Porém tu és o mesmo, e os teus anos não acabarão." E Hebreus 1:12 coloca essas palavras diante de Jesus: os céus se enrolam como um manto, mudam como uma veste — "tu, porém, és o mesmo".

Isso significa que a promessa que sustentou os pais da fé é a mesma que sustenta esta congregação. Aquele capítulo 11, com Abel, Noé, Abraão, Sara, Moisés — aquela gente não recebeu tudo em vida. O texto diz que "todos estes morreram na fé, sem ter obtido as promessas" (Hebreus 11:13). Mas morreram firmes, porque a promessa não dependia da duração deles.

E é por isso que o versículo 7 fala dos líderes que já partiram. Aquela igreja tinha enterrado os seus pastores. Talvez você também tenha enterrado alguém que te ensinou a orar. A carta não diz "esqueçam-se deles". Diz: lembrem-se, considerem o fim da vida deles, imitem a fé deles. E então acrescenta o versículo 8, como quem explica: a fé deles funcionou porque o objeto dela não muda.

Você vai mudar de fase. Vai mudar de cidade, talvez de igreja. Vai perder pessoas. E vai encontrar, no fim, o mesmo Cristo que te encontrou no começo.`),

    b("aplicacao", `Deixe-me trazer isso para a semana que começa amanhã.

1) Sua fé não precisa depender do seu humor. Há domingos em que você canta e sente; há domingos em que você canta e não sente nada. Isso diz respeito a você, não a Ele. Não meça o amor de Cristo pela temperatura do seu coração — meça pela cruz, que não muda.

2) Desconfie da novidade pela novidade. Nem tudo o que é novo é crescimento. Quando aparecer um ensino que promete o que a cruz supostamente não deu, lembre-se de Hebreus 13:9. Traga tudo de volta às Escrituras. A igreja que dura é a que fica com o velho evangelho.

3) Volte esta semana aos mesmos lugares de sempre. À Palavra pela manhã. À oração no fim do dia. À mesa do Senhor com esta comunidade. Não porque essas coisas funcionem como técnica, mas porque é ali que o Cristo imutável prometeu se encontrar conosco.

4) E se você está aqui hoje sem nunca ter se entregado a Ele — entenda que essa constância é um convite. O Jesus que recebeu ladrões, prostitutas e cobradores de impostos não mudou de política. A porta está aberta hoje exatamente como estava naquele dia.`),

    b("conclusao", `O ano vai virar. Sua saúde vai mudar. Os nomes desta lista de membros vão mudar; daqui a cinquenta anos, outros rostos estarão sentados exatamente onde você está sentado agora.

Mas quando tudo o que é temporário tiver passado, você vai descobrir que a única coisa que nunca esteve em risco era justamente aquilo em que você apoiou o peso da sua vida.

"Jesus Cristo é o mesmo, ontem, e hoje, e eternamente."

Que Deus nos dê a graça de descansar nisso.`),

    b("oracao", `Senhor nosso Deus, num mundo que muda depressa demais, ensina-nos a descansar naquilo que não muda. Perdoa a nossa pressa em buscar novidades quando o que precisamos é do velho evangelho. Firma o coração dos que estão cansados, consola os que perderam pessoas queridas e chama a ti os que ainda estão longe. Em nome de Jesus Cristo, que é o mesmo ontem, hoje e eternamente, amém.`),
  ],
}

const sermaoAntigo = {
  title: "A rocha que não se move",
  passage: "Hebreus 13:8",
  status: "pronto",
  blocks: [
    b("introducao", `Pregado na série "A fidelidade de Deus". A ênfase daquela vez foi pastoral: uma igreja que tinha passado por perdas seguidas e precisava ouvir que o alicerce continuava firme.`),
    b("ponto", `A instabilidade da vida humana — e por que ela nos assusta tanto.`),
    b("ponto", `A permanência de Cristo como fundamento, não como conceito abstrato.`),
    b("aplicacao", `Onde firmamos os pés quando tudo o mais se move.`),
    b("conclusao", `Encerramento com a leitura de Hebreus 11:13 e o testemunho dos que morreram na fé.`),
  ],
}

function toText(blocks) {
  return blocks.map((x) => x.text).join("\n")
}

async function main() {
  let users = []
  if (targetUsername) {
    const res = await clerk.users.getUserList({ username: [targetUsername] })
    users = res.data ?? res
    if (users.length === 0) {
      console.error(`Usuário "${targetUsername}" não encontrado no Clerk.`)
      process.exit(1)
    }
  } else {
    const res = await clerk.users.getUserList({ limit: 100 })
    const all = res.data ?? res
    users = all.filter((u) => (u.publicMetadata?.roles ?? []).includes("superadmin"))
    if (users.length === 0) {
      console.error("Nenhum superadmin encontrado. Passe o username: node scripts/seed-sermon.mjs <username>")
      process.exit(1)
    }
  }

  const hoje = new Date()
  const domingo = new Date(hoje); domingo.setDate(hoje.getDate() + ((7 - hoje.getDay()) % 7))
  const anoPassado = new Date(hoje); anoPassado.setFullYear(hoje.getFullYear() - 1)

  const titulos = [sermaoAtual.title, sermaoAntigo.title]

  for (const u of users) {
    const authorName =
      u.fullName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Pastor"

    // Remove exemplos anteriores para não duplicar ao rodar de novo
    await prisma.sermon.deleteMany({ where: { authorId: u.id, title: { in: titulos } } })

    for (const [s, date] of [[sermaoAtual, domingo], [sermaoAntigo, anoPassado]]) {
      await prisma.sermon.create({
        data: {
          authorId: u.id,
          authorName,
          title: s.title,
          passage: s.passage,
          content: toText(s.blocks),
          blocks: s.blocks,
          date,
          status: s.status,
        },
      })
    }

    const palavras = toText(sermaoAtual.blocks).trim().split(/\s+/).length
    console.log(`✅ Sermões de exemplo criados para ${u.username ?? u.id} — sermão principal com ${palavras} palavras (≈ ${Math.round(palavras / 130)} min)`)
  }

  console.log(`\nBanco: ${dbUrl.replace(/:\/\/[^@]*@/, "://***@")}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

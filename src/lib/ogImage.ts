/**
 * Tenta extrair a imagem principal (og:image / twitter:image) de uma página de produto.
 * É best-effort: se o site bloquear, demorar ou não tiver a meta tag, retorna null.
 */
export async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const url = /^https?:\/\//i.test(pageUrl) ? pageUrl : `https://${pageUrl}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    }).catch(() => null)
    clearTimeout(timeout)

    if (!res || !res.ok) return null
    const ct = res.headers.get("content-type") ?? ""
    if (!ct.includes("text/html")) return null

    // Limita o tamanho lido (as metas ficam no <head>).
    const html = (await res.text()).slice(0, 300_000)

    const patterns = [
      /<meta[^>]+(?:property|name)=["']og:image(?::secure_url|:url)?["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image(?::secure_url|:url)?["']/i,
      /<meta[^>]+(?:property|name)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']twitter:image["']/i,
      /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i,
    ]

    for (const re of patterns) {
      const m = html.match(re)
      if (m?.[1]) {
        try {
          return new URL(m[1], url).toString()
        } catch {
          return m[1]
        }
      }
    }
    return null
  } catch {
    return null
  }
}

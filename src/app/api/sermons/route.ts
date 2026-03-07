// src/app/api/sermons/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

async function resolveChannelId(channelUrl: string): Promise<string | null> {
  try {
    const directMatch = channelUrl.match(/youtube\.com\/channel\/(UC[\w-]+)/)
    if (directMatch) return directMatch[1]

    const normalized = channelUrl.replace(/\/$/, "")
    const res = await fetch(normalized, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const html = await res.text()

    const match =
      html.match(/"channelId":"(UC[\w-]+)"/) ||
      html.match(/channel\/(UC[\w-]+)/) ||
      html.match(/"externalId":"(UC[\w-]+)"/)

    return match?.[1] ?? null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const settings = await prisma.churchSettings.findFirst()
    const channelUrl = settings?.youtubeChannelUrl ?? ""

    if (!channelUrl) {
      return NextResponse.json({ videos: [], channelUrl: "" })
    }

    const channelId = await resolveChannelId(channelUrl)
    if (!channelId) {
      return NextResponse.json({ videos: [], channelUrl, error: "channel_not_found" })
    }

    const rssRes = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: 3600 } }
    )
    if (!rssRes.ok) {
      return NextResponse.json({ videos: [], channelUrl, error: "rss_failed" })
    }

    const xml = await rssRes.text()
    const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? []

    const decode = (s: string) =>
      s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'").replace(/&quot;/g, '"')

    const videos = entries.map((entry) => {
      const videoId     = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? ""
      const title       = entry.match(/<title>(.*?)<\/title>/)?.[1] ?? "Sem título"
      const published   = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? ""
      const description = entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1]?.slice(0, 150) ?? ""

      return {
        id: videoId,
        title: decode(title),
        published,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        description: decode(description),
      }
    })

    return NextResponse.json({ videos, channelUrl })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
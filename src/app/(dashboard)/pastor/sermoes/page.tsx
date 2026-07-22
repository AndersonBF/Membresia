import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { ArrowLeft, BookMarked } from "lucide-react"
import SermonsClient, { type Sermon } from "@/components/SermonsClient"

export const dynamic = "force-dynamic"

export default async function SermoesPage() {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const allowed = roles.includes("pastor") || roles.includes("superadmin")
  if (!user || !allowed) notFound()

  const rows = await prisma.sermon.findMany({
    where: { authorId: user.id },
    orderBy: { updatedAt: "desc" },
  })

  const initial: Sermon[] = rows.map((s) => ({
    id: s.id,
    title: s.title,
    passage: s.passage,
    content: s.content,
    blocks: Array.isArray(s.blocks) ? (s.blocks as any) : null,
    date: s.date ? s.date.toISOString() : null,
    series: s.series,
    tags: s.tags ?? [],
    preachedAt: (s.preachedAt ?? []).map((d) => d.toISOString()),
    status: s.status,
    updatedAt: s.updatedAt.toISOString(),
  }))

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Cabeçalho fino — sobra espaço para escrever */}
      <header className="flex items-center gap-3 px-4 md:px-6 py-2.5 border-b border-gray-200 bg-white sticky top-0 z-20 no-print">
        <Link href="/pastor" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-xs transition">
          <ArrowLeft size={14} /> Painel
        </Link>
        <span className="w-px h-4 bg-gray-200" />
        <BookMarked size={16} className="text-teal-700" />
        <h1 className="font-semibold text-gray-900">Sermões</h1>
        <span className="text-xs text-gray-400 hidden sm:inline">· particulares, só você vê</span>
      </header>

      <div className="px-3 md:px-4 py-4">
        <SermonsClient initial={initial} />
      </div>
    </div>
  )
}

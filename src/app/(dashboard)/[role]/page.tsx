import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Announcements from "@/components/Announcements"
import EventCalendarContainer from "@/components/EventCalendarContainer"
import BroadcastFeed from "@/components/BroadcastFeed"
import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { Users, Calendar, FileText, ArrowLeft, Phone, ChevronRight, Clock, Cake } from "lucide-react"

const roleConfig: Record<string, {
  label: string
  tagline: string
  accentColor: string
  accentLight: string
  accentDark: string
}> = {
  ump:        { label: "UMP",        tagline: "União de Mocidade Presbiteriana",     accentColor: "#2563eb", accentLight: "#eff6ff", accentDark: "#1e3a8a" },
  upa:        { label: "UPA",        tagline: "União Presbiteriana de Adolescentes", accentColor: "#d97706", accentLight: "#fffbeb", accentDark: "#78350f" },
  uph:        { label: "UPH",        tagline: "União Presbiteriana de Homens",       accentColor: "#ea580c", accentLight: "#fff7ed", accentDark: "#7c2d12" },
  saf:        { label: "SAF",        tagline: "Sociedade Auxiliadora Feminina",      accentColor: "#db2777", accentLight: "#fdf2f8", accentDark: "#831843" },
  ucp:        { label: "UCP",        tagline: "União das Crianças Presbiterianas",   accentColor: "#f59e0b", accentLight: "#fefce8", accentDark: "#78350f" },
  diaconia:   { label: "Diaconia",   tagline: "Ministério de Serviço e Cuidado",    accentColor: "#0d9488", accentLight: "#f0fdfa", accentDark: "#134e4a" },
  conselho:   { label: "Conselho",   tagline: "Conselho da Igreja",                 accentColor: "#4f46e5", accentLight: "#eef2ff", accentDark: "#1e1b4b" },
  ministerio: { label: "Ministério", tagline: "Ministério de Louvor e Adoração",    accentColor: "#16a34a", accentLight: "#f0fdf4", accentDark: "#14532d" },
  ebd:        { label: "EBD",        tagline: "Escola Bíblica Dominical",           accentColor: "#b45309", accentLight: "#fffbeb", accentDark: "#451a03" },
}

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

const directoryCargos = [
  "Presidente", "Vice-Presidente",
  "1º Secretário", "2º Secretário",
  "Tesoureiro", "1º Tesoureiro", "2º Tesoureiro",
]

const mesesPT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

async function getDataForRole(role: string) {
  const societyId = societyMap[role]
  let memberWhere: any = {}
  let eventWhere: any = {}
  let documentWhere: any = {}
  let directoryMembers: any[] = []

  if (societyId) {
    memberWhere = { societies: { some: { societyId } } }
    eventWhere = { societyId }
    documentWhere = { societyId }

    const societyWithCargos = await prisma.memberSociety.findMany({
      where: { societyId, cargo: { not: null } },
      include: {
        member: {
          select: { id: true, name: true, phone: true, gender: true, isActive: true },
        },
      },
    })

    directoryMembers = societyWithCargos
      .filter((ms) => ms.cargo && directoryCargos.includes(ms.cargo))
      .sort((a, b) => directoryCargos.indexOf(a.cargo!) - directoryCargos.indexOf(b.cargo!))

  } else if (role === "conselho") {
    memberWhere = { council: { isNot: null } }
    documentWhere = { councilId: 1 }
  } else if (role === "diaconia") {
    memberWhere = { diaconate: { isNot: null } }
    documentWhere = { diaconateId: 1 }
  } else if (role === "ministerio") {
    memberWhere = { ministries: { some: {} } }
    documentWhere = { ministryId: { not: null } }
  } else if (role === "ebd") {
    memberWhere = { bibleSchoolClassId: { not: null } }
    documentWhere = { bibleSchoolClassId: { not: null } }
  }

  const now = new Date()

  const [totalMembers, totalEvents, totalDocuments, recentMembers, upcomingEvents, allMembers] = await Promise.all([
    prisma.member.count({ where: memberWhere }),
    prisma.event.count({ where: eventWhere }),
    prisma.document.count({ where: documentWhere }),
    prisma.member.findMany({ where: memberWhere, orderBy: { name: "asc" }, take: 8 }),
    prisma.event.findMany({
      where: { ...eventWhere, date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 3,
    }),
    prisma.member.findMany({
      where: { ...memberWhere, birthDate: { not: null }, isActive: true },
      select: { id: true, name: true, birthDate: true },
    }),
  ])

  // Filtra aniversariantes do mês atual
  const birthdaysThisMonth = allMembers
    .filter((m) => {
      const bd = new Date(m.birthDate!)
      return bd.getMonth() === now.getMonth()
    })
    .sort((a, b) => new Date(a.birthDate!).getDate() - new Date(b.birthDate!).getDate())

  return { totalMembers, totalEvents, totalDocuments, recentMembers, directoryMembers, upcomingEvents, birthdaysThisMonth }
}

const RolePage = async ({
  params,
  searchParams,
}: {
  params: { role: string }
  searchParams: { [key: string]: string | undefined }
}) => {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")

  const { role } = params
  const config = roleConfig[role]

  if (!config || (!isSuperAdmin && !roles.includes(role))) {
    notFound()
  }

  const isAdmin = roles.includes("admin") || isSuperAdmin
  const backHref = isAdmin ? "/admin" : roles.includes("member") ? "/member" : "/admin"

  const { totalMembers, totalEvents, totalDocuments, recentMembers, directoryMembers, upcomingEvents, birthdaysThisMonth } =
    await getDataForRole(role)

  const ac = config.accentColor
  const al = config.accentLight
  const ad = config.accentDark

  const hoje = new Date()
  const mesAtual = mesesPT[hoje.getMonth()]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .rp { font-family: 'DM Sans', sans-serif; }
        @keyframes rp-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .rp-in { animation: rp-in 0.4s cubic-bezier(.22,1,.36,1) both; }
        .d1{animation-delay:.03s}.d2{animation-delay:.08s}.d3{animation-delay:.13s}.d4{animation-delay:.18s}.d5{animation-delay:.23s}.d6{animation-delay:.28s}
        .dir-card { transition: box-shadow .18s, transform .18s; }
        .dir-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.1); transform: translateY(-2px); }
        .dir-phone { opacity:0; transition: opacity .15s; }
        .dir-card:hover .dir-phone { opacity:1; }
        .ql-btn { transition: box-shadow .15s, transform .15s; }
        .ql-btn:hover { box-shadow: 0 4px 14px rgba(0,0,0,.1); transform: translateY(-1px); }
        .ev-row:hover { background: rgba(0,0,0,0.03); }
        .m-row:hover  { background: rgba(0,0,0,0.03); }
        .bday-card { transition: box-shadow .15s, transform .15s; }
        .bday-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-1px); }
      `}} />

      <div className="rp bg-gray-50 min-h-screen">

        {/* HERO */}
        <div className="rp-in d1" style={{ background: ad }}>
          <div className="px-6 md:px-10 pt-6 pb-10">
            <Link href={backHref}
              className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition mb-8">
              <ArrowLeft size={13} /> Voltar
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-white font-bold leading-[0.9]" style={{ fontSize: "clamp(3.5rem,9vw,6rem)" }}>
                  {config.label}
                </h1>
                <p className="text-white/40 text-sm mt-3 font-light">{config.tagline}</p>
              </div>

              <div className="flex divide-x divide-white/10 overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
                {[
                  { n: totalMembers, l: "Membros" },
                  { n: totalEvents, l: "Eventos" },
                  { n: totalDocuments, l: "Docs" },
                ].map((s, i) => (
                  <div key={i} className="px-6 py-4 text-center">
                    <p className="text-white text-2xl font-semibold leading-none">{s.n}</p>
                    <p className="text-white/35 text-[10px] mt-1.5 tracking-wide">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ height: 2, background: `linear-gradient(90deg, ${ac}, ${ac}55, transparent)` }} />
        </div>

        {/* BODY */}
        <div className="p-4 md:p-6 flex gap-6 flex-col lg:flex-row">
          <div className="w-full lg:w-2/3 flex flex-col gap-8">

            {/* QUICK LINKS */}
            <div className="grid grid-cols-3 gap-3 rp-in d2">
              {[
                { label: "Membros",    icon: Users,    href: `/${role}/membros` },
                { label: "Eventos",    icon: Calendar, href: `/list/events?roleContext=${role}` },
                { label: "Documentos", icon: FileText,  href: `/list/documents?roleContext=${role}` },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.label} href={item.href}
                    className="ql-btn bg-white rounded-xl py-4 flex flex-col items-center gap-2 border border-gray-100 shadow-sm">
                    <Icon size={18} style={{ color: ac }} />
                    <span className="text-xs font-medium text-gray-500">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* DIRETORIA */}
            {directoryMembers.length > 0 && (
              <section className="rp-in d3">
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="w-0.5 h-5 rounded-full block" style={{ background: ac }} />
                  <h2 className="text-xl font-semibold text-gray-900">Diretoria</h2>
                  <span className="text-xs text-gray-400 ml-1">— gestão atual</span>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  {directoryMembers.map((ms) => (
                    <div key={ms.id} className="dir-card flex flex-col items-center text-center gap-2">
                      <div className="rounded-full overflow-hidden bg-gray-100" style={{ width: 56, height: 56 }}>
                        <Image src="/profile.png" alt={ms.member.name} width={56} height={56} className="object-cover w-full h-full" />
                      </div>
                      <div className="w-full">
                        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: ac }}>
                          {ms.cargo}
                        </p>
                        <p className="font-semibold text-gray-800 text-xs leading-snug mt-0.5 break-words">
                          {ms.member.name}
                        </p>
                        {ms.member.phone ? (
                          <a href={`tel:${ms.member.phone}`}
                            className="dir-phone mt-1 inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 transition">
                            <Phone size={9} />{ms.member.phone}
                          </a>
                        ) : (
                          <span className="dir-phone mt-1 inline-block text-[10px] text-gray-300 italic">Sem telefone</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PRÓXIMOS EVENTOS */}
            {upcomingEvents.length > 0 && (
              <section className="rp-in d4">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-0.5 h-5 rounded-full block" style={{ background: ac }} />
                    <h2 className="text-xl font-semibold text-gray-900">Próximos Eventos</h2>
                  </div>
                  <Link href={`/list/events?roleContext=${role}`} className="text-xs flex items-center gap-1" style={{ color: ac }}>
                    Ver todos <ChevronRight size={11} />
                  </Link>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {upcomingEvents.map((event, i) => {
                    const d = new Date(event.date)
                    const day = d.getDate().toString().padStart(2, "0")
                    const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase()
                    return (
                      <div key={event.id}
                        className={`ev-row flex items-center gap-4 px-5 py-4 transition-colors ${i < upcomingEvents.length - 1 ? "border-b border-gray-50" : ""}`}>
                        <div className="text-center flex-shrink-0 w-10">
                          <p className="text-[10px] font-semibold" style={{ color: ac }}>{month}</p>
                          <p className="text-xl font-bold text-gray-900 leading-tight">{day}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-100 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{event.title}</p>
                          {event.startTime && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock size={9} />
                              {new Date(event.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ANIVERSARIANTES DO MÊS */}
            {birthdaysThisMonth.length > 0 && (
              <section className="rp-in d5">
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="w-0.5 h-5 rounded-full block" style={{ background: ac }} />
                  <h2 className="text-xl font-semibold text-gray-900">Aniversariantes</h2>
                  <span className="text-xs text-gray-400 ml-1">— {mesAtual}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {birthdaysThisMonth.map((m) => {
                    const bd = new Date(m.birthDate!)
                    const dia = bd.getDate()
                    const isHoje = bd.getDate() === hoje.getDate() && bd.getMonth() === hoje.getMonth()

                    return (
                      <div
                        key={m.id}
                        className={`bday-card rounded-xl p-3 flex flex-col items-center gap-2 border text-center relative overflow-hidden
                          ${isHoje
                            ? "bg-pink-50 border-pink-200 shadow-sm"
                            : "bg-white border-gray-100 shadow-sm"
                          }`}
                      >
                        {isHoje && (
                          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${ac}, #f472b6)` }} />
                        )}

                        {/* Dia em destaque */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm"
                          style={{ background: isHoje ? "#f472b6" : ac }}
                        >
                          {dia}
                        </div>

                        {/* Foto */}
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white shadow-sm">
                          <Image src="/profile.png" alt={m.name} width={48} height={48} className="object-cover" />
                        </div>

                        {/* Nome */}
                        <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">
                          {m.name.split(" ")[0]}
                        </p>

                        {isHoje && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
                            <Cake size={9} /> Hoje!
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* MENSAGENS */}
            {societyMap[role] && (
              <div className="rp-in d6">
                <BroadcastFeed
                  societyId={societyMap[role]}
                  role={role}
                  accentColor={ac}
                />
              </div>
            )}

            {/* MEMBROS */}
            <section className="rp-in d6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-0.5 h-5 rounded-full block" style={{ background: ac }} />
                  <h2 className="text-xl font-semibold text-gray-900">Membros</h2>
                  <span className="text-xs text-gray-400 ml-1">— {totalMembers} no total</span>
                </div>
                <Link href={`/${role}/membros`} className="text-xs flex items-center gap-1" style={{ color: ac }}>
                  Ver todos <ChevronRight size={11} />
                </Link>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {recentMembers.length === 0 ? (
                  <p className="p-8 text-center text-gray-400 text-sm">Nenhum membro cadastrado.</p>
                ) : (
                  recentMembers.map((m, i) => (
                    <div key={m.id}
                      className={`m-row flex items-center gap-3 px-5 py-3.5 transition-colors ${i < recentMembers.length - 1 ? "border-b border-gray-50" : ""}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image src="/profile.png" alt={m.name} width={32} height={32} className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                        {m.phone && (
                          <a href={`tel:${m.phone}`} className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600 transition mt-0.5">
                            <Phone size={9} />{m.phone}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            background: m.gender === "MASCULINO" ? "#eff6ff" : m.gender === "FEMININO" ? "#fdf2f8" : "#f3f4f6",
                            color: m.gender === "MASCULINO" ? "#1d4ed8" : m.gender === "FEMININO" ? "#be185d" : "#9ca3af",
                          }}>
                          {m.gender === "MASCULINO" ? "M" : m.gender === "FEMININO" ? "F" : "—"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          m.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                        }`}>
                          {m.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <EventCalendarContainer searchParams={searchParams} />
            <Announcements />
          </div>
        </div>
      </div>
    </>
  )
}

export default RolePage
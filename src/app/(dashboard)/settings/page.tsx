"use client"

import { useState } from "react"
import {
  Church, Bell, Shield, Users, Palette,
  Database, ChevronRight, Save, ToggleLeft,
  ToggleRight, Trash2, Download, Upload,
  AlertTriangle, Check, Info, Mail, Phone,
  MapPin, Globe, BookOpen, Calendar,
  UserCheck, Lock, Eye, EyeOff, RefreshCw,
} from "lucide-react"

// ─── tipos ───────────────────────────────────────────
type Section =
  | "igreja"
  | "notificacoes"
  | "privacidade"
  | "membros"
  | "aparencia"
  | "dados"

interface Toggle {
  id: string
  label: string
  description: string
  value: boolean
}

// ─── estado inicial ───────────────────────────────────
const initialToggles: Record<string, Toggle[]> = {
  notificacoes: [
    { id: "aniversarios", label: "Aniversariantes do dia", description: "Notifica administradores sobre aniversários", value: true },
    { id: "novos_membros", label: "Novos membros cadastrados", description: "Alerta quando um membro é adicionado", value: true },
    { id: "eventos_proximos", label: "Eventos próximos", description: "Lembrete 24h antes de eventos", value: false },
    { id: "financeiro", label: "Resumo financeiro mensal", description: "Relatório automático no fim do mês", value: true },
    { id: "presenca_baixa", label: "Presença abaixo de 50%", description: "Alerta quando a frequência cai", value: false },
  ],
  privacidade: [
    { id: "telefone_visivel", label: "Telefone visível entre membros", description: "Membros comuns podem ver telefones", value: false },
    { id: "email_visivel", label: "E-mail visível entre membros", description: "Membros comuns podem ver e-mails", value: false },
    { id: "financeiro_restrito", label: "Financeiro apenas para admin", description: "Oculta dados financeiros de líderes", value: true },
    { id: "log_acesso", label: "Registrar acessos ao sistema", description: "Armazena log de entradas por usuário", value: true },
  ],
  membros: [
    { id: "auto_inativo", label: "Inativar membro após 6 meses sem presença", description: "Marcação automática de inatividade", value: false },
    { id: "confirmar_exclusao", label: "Exigir confirmação ao excluir membro", description: "Proteção contra exclusões acidentais", value: true },
    { id: "exportar_membros", label: "Permitir exportação de membros para Excel", description: "Disponível para admin e superadmin", value: true },
    { id: "foto_obrigatoria", label: "Solicitar foto no cadastro", description: "Exibe aviso ao criar membro sem foto", value: false },
  ],
}

const sidebarItems: { id: Section; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "igreja",        label: "Dados da Igreja",     icon: Church },
  { id: "notificacoes",  label: "Notificações",         icon: Bell,    badge: "5" },
  { id: "privacidade",   label: "Privacidade",          icon: Shield },
  { id: "membros",       label: "Membros",              icon: Users },
  { id: "aparencia",     label: "Aparência",            icon: Palette },
  { id: "dados",         label: "Dados & Backup",       icon: Database },
]

// ─── componentes auxiliares ──────────────────────────
function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
      <div className="p-2.5 bg-green-50 rounded-xl">
        <Icon size={22} className="text-green-700" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function ToggleRow({ toggle, onChange }: { toggle: Toggle; onChange: (id: string, val: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-semibold text-gray-700">{toggle.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{toggle.description}</p>
      </div>
      <button
        onClick={() => onChange(toggle.id, !toggle.value)}
        className="shrink-0 transition-all duration-200"
      >
        {toggle.value
          ? <ToggleRight size={32} className="text-green-600" />
          : <ToggleLeft size={32} className="text-gray-300" />
        }
      </button>
    </div>
  )
}

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
        saved
          ? "bg-green-100 text-green-700"
          : "bg-green-600 hover:bg-green-700 text-white shadow-sm"
      }`}
    >
      {saved ? <Check size={16} /> : <Save size={16} />}
      {saved ? "Salvo!" : "Salvar alterações"}
    </button>
  )
}

// ─── página principal ─────────────────────────────────
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("igreja")
  const [toggles, setToggles] = useState(initialToggles)
  const [saved, setSaved] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // dados da igreja (apenas UI — persistir via API)
  const [churchData, setChurchData] = useState({
    name: "Igreja Presbiteriana",
    city: "Toledo",
    state: "PR",
    address: "Rua das Palmeiras, 123",
    phone: "(45) 99999-9999",
    email: "contato@ipb.com.br",
    website: "",
    pastor: "Rev. João da Silva",
    founded: "1985",
  })

  const [accentColor, setAccentColor] = useState("green")
  const colorOptions = [
    { id: "green",  label: "Verde",   bg: "bg-green-600" },
    { id: "blue",   label: "Azul",    bg: "bg-blue-600" },
    { id: "indigo", label: "Índigo",  bg: "bg-indigo-600" },
    { id: "purple", label: "Roxo",    bg: "bg-purple-600" },
    { id: "teal",   label: "Teal",    bg: "bg-teal-600" },
  ]

  function handleToggle(section: string, id: string, val: boolean) {
    setToggles((prev) => ({
      ...prev,
      [section]: prev[section].map((t) => t.id === id ? { ...t, value: val } : t),
    }))
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-0 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
        <p className="text-sm text-gray-400 mt-1">Gerencie as preferências do sistema da igreja.</p>
      </div>

      <div className="flex gap-5 flex-col md:flex-row">

        {/* Sidebar */}
        <aside className="md:w-56 shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const active = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full text-left ${
                    active
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={17} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Conteúdo */}
        <main className="flex-1 bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6">

          {/* ── DADOS DA IGREJA ── */}
          {activeSection === "igreja" && (
            <>
              <SectionHeader icon={Church} title="Dados da Igreja" description="Informações gerais da congregação exibidas no sistema." />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Nome da Igreja", key: "name", icon: Church, full: true },
                  { label: "Pastor/Responsável", key: "pastor", icon: UserCheck },
                  { label: "Ano de Fundação", key: "founded", icon: BookOpen },
                  { label: "Cidade", key: "city", icon: MapPin },
                  { label: "Estado", key: "state", icon: MapPin },
                  { label: "Endereço", key: "address", icon: MapPin, full: true },
                  { label: "Telefone", key: "phone", icon: Phone },
                  { label: "E-mail", key: "email", icon: Mail },
                  { label: "Website", key: "website", icon: Globe },
                ].map((field) => (
                  <div key={field.key} className={field.full ? "sm:col-span-2" : ""}>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <field.icon size={12} />
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={(churchData as any)[field.key]}
                      onChange={(e) => setChurchData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 text-gray-700"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <SaveButton onClick={handleSave} saved={saved} />
              </div>
            </>
          )}

          {/* ── NOTIFICAÇÕES ── */}
          {activeSection === "notificacoes" && (
            <>
              <SectionHeader icon={Bell} title="Notificações" description="Controle quais alertas automáticos o sistema deve enviar." />

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">As notificações são enviadas apenas para administradores e superadmins por enquanto.</p>
              </div>

              <div className="divide-y divide-gray-50">
                {toggles.notificacoes.map((t) => (
                  <ToggleRow key={t.id} toggle={t} onChange={(id, val) => handleToggle("notificacoes", id, val)} />
                ))}
              </div>

              <div className="flex justify-end">
                <SaveButton onClick={handleSave} saved={saved} />
              </div>
            </>
          )}

          {/* ── PRIVACIDADE ── */}
          {activeSection === "privacidade" && (
            <>
              <SectionHeader icon={Shield} title="Privacidade & Segurança" description="Controle o que cada nível de acesso pode visualizar." />

              <div className="divide-y divide-gray-50">
                {toggles.privacidade.map((t) => (
                  <ToggleRow key={t.id} toggle={t} onChange={(id, val) => handleToggle("privacidade", id, val)} />
                ))}
              </div>

              <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lock size={15} className="text-green-600" />
                  Alterar senha de acesso ao sistema
                </p>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nova senha"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 pr-10"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button className="self-start text-xs bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                  Atualizar senha
                </button>
              </div>

              <div className="flex justify-end">
                <SaveButton onClick={handleSave} saved={saved} />
              </div>
            </>
          )}

          {/* ── MEMBROS ── */}
          {activeSection === "membros" && (
            <>
              <SectionHeader icon={Users} title="Configurações de Membros" description="Regras e comportamentos para o cadastro de membros." />

              <div className="divide-y divide-gray-50">
                {toggles.membros.map((t) => (
                  <ToggleRow key={t.id} toggle={t} onChange={(id, val) => handleToggle("membros", id, val)} />
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Calendar size={12} />
                    Meses até inatividade automática
                  </p>
                  <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 text-gray-700">
                    <option>3 meses</option>
                    <option>6 meses</option>
                    <option selected>12 meses</option>
                    <option>Nunca</option>
                  </select>
                </div>

                <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <UserCheck size={12} />
                    Itens por página na listagem
                  </p>
                  <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 text-gray-700">
                    <option>10</option>
                    <option selected>20</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <SaveButton onClick={handleSave} saved={saved} />
              </div>
            </>
          )}

          {/* ── APARÊNCIA ── */}
          {activeSection === "aparencia" && (
            <>
              <SectionHeader icon={Palette} title="Aparência" description="Personalize as cores e o visual do sistema." />

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Cor de destaque do sistema</p>
                <div className="flex gap-3 flex-wrap">
                  {colorOptions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setAccentColor(c.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition ${
                        accentColor === c.id ? "border-green-500 bg-green-50" : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${c.bg}`} />
                      <span className="text-xs text-gray-600 font-medium">{c.label}</span>
                      {accentColor === c.id && <Check size={12} className="text-green-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Tema do menu lateral</p>
                <div className="flex gap-3">
                  {[
                    { id: "dark", label: "Escuro", preview: "bg-gradient-to-b from-green-900 to-emerald-950" },
                    { id: "light", label: "Claro", preview: "bg-gradient-to-b from-green-100 to-emerald-50 border border-gray-200" },
                  ].map((t) => (
                    <button key={t.id} className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-gray-100 hover:border-green-300 transition">
                      <div className={`w-12 h-16 rounded-lg ${t.preview}`} />
                      <span className="text-xs text-gray-600 font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <SaveButton onClick={handleSave} saved={saved} />
              </div>
            </>
          )}

          {/* ── DADOS & BACKUP ── */}
          {activeSection === "dados" && (
            <>
              <SectionHeader icon={Database} title="Dados & Backup" description="Exportação, importação e limpeza de dados do sistema." />

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Download,
                    title: "Exportar membros",
                    desc: "Baixar lista completa em Excel (.xlsx)",
                    label: "Exportar",
                    color: "text-green-700 bg-green-50 hover:bg-green-100",
                    href: "/export/members",
                  },
                  {
                    icon: Download,
                    title: "Exportar financeiro",
                    desc: "Relatório financeiro completo em Excel",
                    label: "Exportar",
                    color: "text-blue-700 bg-blue-50 hover:bg-blue-100",
                    href: "#",
                  },
                  {
                    icon: Upload,
                    title: "Importar membros",
                    desc: "Importar membros de uma planilha Excel",
                    label: "Importar",
                    color: "text-indigo-700 bg-indigo-50 hover:bg-indigo-100",
                    href: "#",
                  },
                  {
                    icon: RefreshCw,
                    title: "Sincronizar com Clerk",
                    desc: "Reprocessar usuários e permissões",
                    label: "Sincronizar",
                    color: "text-amber-700 bg-amber-50 hover:bg-amber-100",
                    href: "#",
                  },
                ].map((card) => (
                  <a
                    key={card.title}
                    href={card.href}
                    className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${card.color}`}>
                        <card.icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{card.title}</p>
                        <p className="text-xs text-gray-400">{card.desc}</p>
                      </div>
                    </div>
                    <span className={`self-start text-xs font-semibold px-3 py-1.5 rounded-lg ${card.color} transition`}>
                      {card.label} →
                    </span>
                  </a>
                ))}
              </div>

              {/* Zona de perigo */}
              <div className="border-2 border-red-100 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={17} />
                  <p className="text-sm font-bold">Zona de Perigo</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Limpar presenças antigas</p>
                    <p className="text-xs text-gray-400">Remove registros de presença com mais de 2 anos</p>
                  </div>
                  <button className="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg font-semibold transition flex items-center gap-1.5">
                    <Trash2 size={13} />
                    Limpar
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Redefinir configurações</p>
                    <p className="text-xs text-gray-400">Volta todas as configurações ao padrão</p>
                  </div>
                  <button className="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg font-semibold transition flex items-center gap-1.5">
                    <RefreshCw size={13} />
                    Redefinir
                  </button>
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  )
}
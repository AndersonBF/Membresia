"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Church, Plus, ExternalLink, Copy, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"

type Tenant = { slug: string; name: string; status: string }

type Props = {
  controlPlane: boolean
  neon: boolean
  baseDomain: string | null
  tenants: Tenant[]
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30)
}

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Ativa", cls: "bg-green-50 text-green-700" },
  provisioning: { label: "Provisionando", cls: "bg-amber-50 text-amber-700" },
  suspended: { label: "Suspensa", cls: "bg-gray-100 text-gray-500" },
}

export default function IgrejasClient({ controlPlane, neon, baseDomain, tenants: initial }: Props) {
  const [tenants, setTenants] = useState<Tenant[]>(initial)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [adminName, setAdminName] = useState("")
  const [role, setRole] = useState<"admin" | "pastor">("admin")
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<
    | null
    | { slug: string; name: string; url: string | null; admin: { username: string; password: string } | null }
  >(null)

  const onName = (v: string) => {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast.success("Copiado"),
      () => {},
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      toast.error("Informe nome e slug")
      return
    }
    setLoading(true)
    setCreated(null)
    try {
      const res = await fetch("/api/admin/churches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim(), adminName: adminName.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? "Falha ao criar igreja")
        return
      }
      toast.success(`Igreja "${data.name}" criada`)
      setCreated(data)
      setTenants((prev) => [{ slug: data.slug, name: data.name, status: "active" }, ...prev])
      setName("")
      setSlug("")
      setSlugTouched(false)
      setAdminName("")
    } catch {
      toast.error("Erro de rede ao criar igreja")
    } finally {
      setLoading(false)
    }
  }

  if (!controlPlane) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Control-plane não configurado</p>
          <p className="mt-1 text-amber-700">
            Defina <code className="bg-amber-100 px-1 rounded">CONTROL_PLANE_DATABASE_URL</code> para
            habilitar a criação de igrejas por aqui.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Painel de sucesso com credenciais (aparece uma vez após criar) */}
      {created && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-green-600" />
            <h3 className="font-semibold text-green-800">Igreja &quot;{created.name}&quot; criada</h3>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            {created.url && (
              <a
                href={created.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-teal-700 hover:underline w-fit"
              >
                {created.url} <ExternalLink size={13} />
              </a>
            )}
            {created.admin ? (
              <div className="rounded-xl bg-white border border-green-100 p-3 mt-1">
                <p className="text-xs text-gray-400 mb-2">
                  Credenciais do admin — anote agora, a senha não será mostrada de novo.
                </p>
                <div className="flex items-center gap-2 text-gray-800">
                  <span className="text-gray-400 w-16">Usuário</span>
                  <code className="font-mono">{created.admin.username}</code>
                  <button onClick={() => copy(created.admin!.username)} className="text-gray-400 hover:text-gray-700">
                    <Copy size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-gray-800 mt-1">
                  <span className="text-gray-400 w-16">Senha</span>
                  <code className="font-mono">{created.admin.password}</code>
                  <button onClick={() => copy(created.admin!.password)} className="text-gray-400 hover:text-gray-700">
                    <Copy size={13} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">Troca obrigatória no primeiro acesso.</p>
              </div>
            ) : (
              <p className="text-green-700 text-xs">Nenhum admin criado (campo em branco).</p>
            )}
          </div>
        </div>
      )}

      {/* Formulário de nova igreja */}
      <form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Plus size={17} className="text-teal-700" />
          <h2 className="font-semibold text-gray-900">Nova igreja</h2>
        </div>

        {!neon && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            API do Neon não configurada (NEON_API_KEY / NEON_PROJECT_ID) — a criação vai falhar.
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Nome da igreja</span>
            <input
              value={name}
              onChange={(e) => onName(e.target.value)}
              placeholder="IPB Cascavel"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Slug (subdomínio)</span>
            <div className="flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-teal-600/30">
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(slugify(e.target.value))
                }}
                placeholder="ipbcascavel"
                className="flex-1 focus:outline-none"
              />
              {baseDomain && <span className="text-gray-400">.{baseDomain}</span>}
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Nome do admin (opcional)</span>
            <input
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Rev. João da Silva"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Papel do admin</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "pastor")}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            >
              <option value="admin">Admin</option>
              <option value="pastor">Pastor</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="self-start inline-flex items-center gap-2 rounded-lg bg-teal-700 text-white px-4 py-2 text-sm font-medium hover:bg-teal-800 transition disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Church size={15} />}
          {loading ? "Provisionando…" : "Criar igreja"}
        </button>
      </form>

      {/* Lista de igrejas existentes */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Church size={15} className="text-teal-700" />
          <h2 className="text-sm font-semibold text-gray-900">Igrejas cadastradas</h2>
          <span className="ml-auto text-xs text-gray-400">{tenants.length}</span>
        </div>
        {tenants.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">Nenhuma igreja no control-plane ainda.</p>
        ) : (
          tenants.map((t) => {
            const st = STATUS[t.status] ?? { label: t.status, cls: "bg-gray-100 text-gray-500" }
            const url = baseDomain ? `https://${t.slug}.${baseDomain}` : null
            return (
              <div key={t.slug} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer" className="hover:text-teal-700 hover:underline">
                        {t.slug}.{baseDomain}
                      </a>
                    ) : (
                      t.slug
                    )}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

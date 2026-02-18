"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { memberSchema, MemberSchema } from "@/lib/formValidationSchemas";
import { updateMember } from "@/lib/actions";
import { Dispatch, SetStateAction, useTransition, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import InputField from "../InputField";

const roleOptions = [
  { id: "ump", label: "UMP" },
  { id: "upa", label: "UPA" },
  { id: "uph", label: "UPH" },
  { id: "saf", label: "SAF" },
  { id: "ucp", label: "UCP" },
  { id: "diaconia", label: "Diaconia" },
  { id: "conselho", label: "Conselho" },
  { id: "ministerio", label: "Ministério" },
  { id: "ebd", label: "EBD" },
]

const MemberForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberSchema>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      isActive: true,
      gender: "M",
    },
  });

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => {
  if (!data) return []
  const roles: string[] = []
  const societyIdMap: Record<number, string> = { 3: "saf", 4: "uph", 5: "ump", 6: "upa", 7: "ucp" }
  if (data.societies?.length) {
    data.societies.forEach((s: any) => {
      if (societyIdMap[s.societyId]) roles.push(societyIdMap[s.societyId])
    })
  }
  if (data.council) roles.push("conselho")
  if (data.diaconate) roles.push("diaconia")
  if (data.ministries?.length) roles.push("ministerio")
  if (data.bibleSchoolClass) roles.push("ebd")
  return roles
})
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null)

  const gender = watch("gender")

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    )
  }

  const onSubmit = handleSubmit(
    (formData) => {
      startTransition(async () => {
        if (type === "create") {
          const res = await fetch("/api/admin/create-member", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              birthDate: formData.birthDate,
              gender: formData.gender,
              roles: selectedRoles,
            }),
          })

          const result = await res.json()

          if (res.ok) {
            setCredentials({ username: result.username, password: result.password })
            toast.success("Membro criado com sucesso!")
            router.refresh()
          } else {
            toast.error(result.error ?? "Erro ao criar membro!")
          }
                } else {
          const result = await updateMember(
            { success: false, error: false },
            { ...formData, roles: selectedRoles } as any
          )

          if (result.success) {
            toast.success("Membro atualizado com sucesso!")
            setOpen(false)
            router.refresh()
          } else {
            toast.error("Erro ao atualizar!")
          }
        }
      })
    },
    (errors) => {
      console.log("❌ Erros de validação:", errors)
    }
  )

  if (credentials) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-green-700">✅ Membro criado!</h2>
        <p className="text-sm text-gray-600">Anote as credenciais abaixo e repasse ao membro:</p>
        <div className="bg-gray-100 rounded-md p-4 font-mono flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Username:</span>
            <span className="font-bold">{credentials.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Senha:</span>
            <span className="font-bold">{credentials.password}</span>
          </div>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`Username: ${credentials.username}\nSenha: ${credentials.password}`)
            toast.success("Credenciais copiadas!")
          }}
          className="bg-green-600 text-white py-2 rounded-md text-sm hover:bg-green-700 transition"
        >
          Copiar credenciais
        </button>
        <button
          onClick={() => setOpen(false)}
          className="bg-gray-500 text-white py-2 rounded-md text-sm hover:bg-gray-600 transition"
        >
          Fechar
        </button>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Criar membro" : "Editar membro"}
      </h1>

      <InputField
        label="Nome"
        name="name"
        defaultValue={data?.name}
        register={register}
        error={errors.name}
      />

      <InputField
        label="Email"
        name="email"
        defaultValue={data?.email}
        register={register}
        error={errors.email}
      />

      <InputField
        label="Telefone"
        name="phone"
        defaultValue={data?.phone}
        register={register}
        error={errors.phone}
      />

      {/* GÊNERO */}
      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-600 font-medium">Gênero</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setValue("gender", "M")}
            className={`flex-1 py-2 rounded-md text-sm font-medium border transition
              ${gender === "M"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
          >
            Masculino
          </button>
          <button
            type="button"
            onClick={() => setValue("gender", "F")}
            className={`flex-1 py-2 rounded-md text-sm font-medium border transition
              ${gender === "F"
                ? "bg-pink-500 text-white border-pink-500"
                : "bg-white text-gray-700 border-gray-300 hover:border-pink-400"
              }`}
          >
            Feminino
          </button>
        </div>
      </div>

      {/* GRUPOS */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-600 font-medium">
          {type === "create" ? "Grupos do membro" : "Grupos (roles)"}
        </span>
        <div className="grid grid-cols-3 gap-2">
          {roleOptions.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => toggleRole(role.id)}
              className={`py-2 px-3 rounded-md text-sm font-medium border transition
                ${selectedRoles.includes(role.id)
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white text-gray-700 border-gray-300 hover:border-green-500"
                }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {type === "update" && (
        <input type="hidden" {...register("id")} defaultValue={data?.id} />
      )}

      <button
        disabled={isPending}
        className="bg-blue-500 text-white p-2 rounded-md disabled:opacity-50"
      >
        {isPending ? "Salvando..." : type === "create" ? "Criar" : "Atualizar"}
      </button>
    </form>
  )
}

export default MemberForm
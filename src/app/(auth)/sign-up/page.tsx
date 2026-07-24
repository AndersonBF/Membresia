"use client";

export const dynamic = "force-dynamic";


import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

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
];

const SignUpPage = () => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/admin");
    }
  }, [isLoaded, isSignedIn, router]);

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <div className="h-screen flex items-center justify-center bg-green-800">
      <SignUp.Root>
        <SignUp.Step
          name="start"
          className="bg-green-200 p-12 rounded-md shadow-2xl flex flex-col gap-3 w-full max-w-md"
        >
          <h1 className="text-3xl font-bold">Membresia</h1>
          <h2 className="text-gray-800">Crie sua conta</h2>

          <Clerk.GlobalError className="text-sm text-red-400" />

          <Clerk.Field name="username" className="flex flex-col gap-1">
            <Clerk.Label className="text-xs text-gray-500">
              Username
            </Clerk.Label>
            <Clerk.Input
              type="text"
              required
              className="p-2 rounded-md ring-1 ring-gray-300"
            />
            <Clerk.FieldError className="text-xs text-red-400" />
          </Clerk.Field>

          <Clerk.Field name="password" className="flex flex-col gap-1">
            <Clerk.Label className="text-xs text-gray-500">
              Senha
            </Clerk.Label>
            <Clerk.Input
              type="password"
              required
              className="p-2 rounded-md ring-1 ring-gray-300"
            />
            <Clerk.FieldError className="text-xs text-red-400" />
          </Clerk.Field>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-500">
              Você pertence a algum grupo? (opcional)
            </span>

            <div className="grid grid-cols-3 gap-2">
              {roleOptions.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={`py-2 px-3 rounded-md text-sm font-medium border transition
                    ${
                      selectedRoles.includes(role.id)
                        ? "bg-green-700 text-white border-green-700"
                        : "bg-white text-gray-700 border-gray-300 hover:border-green-500"
                    }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          <Clerk.Field name="unsafeMetadata" className="hidden">
            <Clerk.Input
              type="hidden"
              value={JSON.stringify({ roles: selectedRoles })}
            />
          </Clerk.Field>

          <SignUp.Action
            submit
            className="bg-green-700 text-white my-1 rounded-md text-sm p-[10px]"
          >
            Cadastrar
          </SignUp.Action>

          <p className="text-xs text-center text-gray-600">
            Já tem conta?{" "}
            <a href="/sign-in" className="text-green-700 font-semibold">
              Entre aqui
            </a>
          </p>
        </SignUp.Step>

        <SignUp.Step
          name="restricted"
          className="bg-white p-10 rounded-md shadow-2xl flex flex-col items-center gap-4 w-full max-w-md text-center"
        >
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-800">Conta Google não vinculada</h2>

          <p className="text-sm text-gray-600 leading-relaxed">
            Este email do Google ainda não está vinculado a nenhuma conta. Como o
            cadastro é restrito, não é possível criar uma conta pelo Google.
          </p>

          <p className="text-sm text-gray-600 leading-relaxed">
            Entre com seu <strong>usuário e senha</strong> e vincule sua conta Google
            em <strong>“Meu Perfil”</strong>. Depois disso você poderá entrar com o Google.
          </p>

          <a
            href="/sign-in"
            className="mt-2 w-full bg-green-700 hover:bg-green-800 text-white rounded-md text-sm py-3 font-medium transition"
          >
            Voltar para o login
          </a>
        </SignUp.Step>
      </SignUp.Root>
    </div>
  );
};

export default SignUpPage;

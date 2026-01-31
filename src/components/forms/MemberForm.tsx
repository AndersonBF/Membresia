"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import InputField from "../InputField";


export const dynamic = "force-dynamic";

const schema = z.object({
  username: z
  .string()
  .min(3, { message: "username precis ter 3 caracteres"})
  .max(20, { message: "username precis ter no maximo 20 caracteres"}),
  email: z.string().email("Email invalido"),
  
  nome: z.string().min(1 ,{message: "Primerio nome precisa ser"}),
  sobrenome: z.string().min(1 ,{message: "Sobrenome nome precisa ser"}),
  sexo: z.enum (["masculino", "feminino"], {message:"Genero é requisitado"}),

});

type Inputs = z.infer<typeof schema>;

const MemberForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
    const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(data=> console.log(data))

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
            <h1 className="text-xl font-semibold">Insira um novo membro</h1>
            <span className="text-xs">autenti

            </span>
              <div className="flex justify-between flex-wrap gap-4">
            <InputField
          label="Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        </div>

        
      
        
    <span className="text-xs text-gray-400 font-medium">
        Personal Infomation
    </span>
    <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Nome"
          name="firstName"
          defaultValue={data?.firstName}
          register={register}
          error={errors.nome}
        />
        <InputField
          label="Sobrenome"
          name="lastname"
          defaultValue={data?.lastname}
          register={register}
          error={errors.sobrenome}
        />
        
        
        
       
        
        </div>
    <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update "}
    </button>
    </form>


  )


  return <form className="">input</form>

}
export default MemberForm



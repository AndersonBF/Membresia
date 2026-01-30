import {z} from "zod";

export const memberSchema = z.object({
  id: z.coerce.number().optional(),
  username: z
  .string()
  .min(3, { message: "username precis ter 3 caracteres"})
  .max(20, { message: "username precis ter no maximo 20 caracteres"}),
  email: z.string(). email({message:"Email invalido"})
  .optional()
  .or(z.literal("")),
  
  nome: z.string().min(1 ,{message: "Primerio nome precisa ser"}),
  sobrenome: z.string().min(1 ,{message: "Sobrenome nome precisa ser"}),
  sexo: z.enum (["masculino", "feminino"], {message:"Genero é requisitado"}),

});
export type MemberSchema = z.infer<typeof memberSchema>;

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  members: z.array(z.string()).optional(),
  

});

export type SubjectSchema = z.infer<typeof subjectSchema>;
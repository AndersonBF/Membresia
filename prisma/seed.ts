import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Admin padrão
  await prisma.admin.createMany({
    data: [
      {
        id: "admin-1",
        username: "admin"
      },
      {
        id: "pastor-1",
        username: "pastor"
      }
    ],
    skipDuplicates: true
  });

  // Membros
  await prisma.membro.createMany({
    data: [
      {
        username: "anderson",
        nome: "Anderson",
        sobrenome: "Brito",
        email: "anderson@igreja.com",
        telefone: "11999999999",
        sexo: "Masculino",
        ativo: true
      },
      {
        username: "maria",
        nome: "Maria",
        sobrenome: "Silva",
        email: "maria@igreja.com",
        telefone: "11888888888",
        sexo: "Feminino",
        ativo: true
      },
      {
        username: "joao",
        nome: "João",
        sobrenome: "Oliveira",
        email: "joao@igreja.com",
        telefone: "11777777777",
        sexo: "Masculino",
        ativo: true
      },
      {
        username: "ana",
        nome: "Ana",
        sobrenome: "Costa",
        email: "ana@igreja.com",
        telefone: "11666666666",
        sexo: "Feminino",
        ativo: true
      },
      {
        username: "paulo",
        nome: "Paulo",
        sobrenome: "Santos",
        email: "paulo@igreja.com",
        telefone: "11555555555",
        sexo: "Masculino",
        ativo: true
      }
    ],
    skipDuplicates: true
  });

  console.log("Seed de Admins e Membros criado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

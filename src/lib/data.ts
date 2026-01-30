// TEMPORARY DATA BASED ON PRISMA SCHEMA

export let role = "admin";

export const adminsData = [
  {
    id: "admin-1",
    username: "admin",
  },
  {
    id: "admin-2",
    username: "secretaria",
  },
];

export const membrosData = [
  {
    id: 1,
    username: "joaosilva",
    nome: "João",
    sobrenome: "Silva",
    email: "joao@igreja.com",
    telefone: "11999999999",
    ativo: true,
    sexo: "M",
    createdAt: "2025-01-01T10:00:00Z",
  },
  {
    id: 2,
    username: "mariasantos",
    nome: "Maria",
    sobrenome: "Santos",
    email: "maria@igreja.com",
    telefone: "11888888888",
    ativo: true,
    sexo: "F",
    createdAt: "2025-01-02T11:00:00Z",
  },
  {
    id: 3,
    username: "paulocosta",
    nome: "Paulo",
    sobrenome: "Costa",
    email: "paulo@igreja.com",
    telefone: "11777777777",
    ativo: false,
    sexo: "M",
    createdAt: "2025-01-03T09:30:00Z",
  },
  {
    id: 4,
    username: "anarocha",
    nome: "Ana",
    sobrenome: "Rocha",
    email: "ana@igreja.com",
    telefone: "11666666666",
    ativo: true,
    sexo: "F",
    createdAt: "2025-01-04T14:20:00Z",
  },
  {
    id: 5,
    username: "lucaspereira",
    nome: "Lucas",
    sobrenome: "Pereira",
    email: "lucas@igreja.com",
    telefone: "11555555555",
    ativo: true,
    sexo: "M",
    createdAt: "2025-01-05T16:00:00Z",
  },
];

// TEMPORARY DATA BASED ON PRISMA SCHEMA


export const positionData = [
  {
    id: 1,
    positionId: "POS-001",
    name: "João Silva",
    email: "joao@igreja.com",
    phone: "11999999999",
    photo:
      "https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200",
    
  },
  {
    id: 2,
    positionId: "POS-002",
    name: "Maria Santos",
    email: "maria@igreja.com",
    phone: "11888888888",
     photo:
      "https://images.pexels.com/photos/936126/pexels-photo-936126.jpeg?auto=compress&cs=tinysrgb&w=1200",
    
  },
  {
    id: 3,
    positionId: "POS-003",
    name: "Paulo Costa",
    email: "paulo@igreja.com",
    phone: "11777777777",
     photo:
      "https://images.pexels.com/photos/428328/pexels-photo-428328.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    id: 4,
    positionId: "POS-004",
    name: "Ana Rocha",
    email: "ana@igreja.com",
    phone: "11666666666",
     photo:
      "https://images.pexels.com/photos/428328/pexels-photo-428328.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    id: 5,
    positionId: "POS-005",
    name: "Lucas Pereira",
    email: "lucas@igreja.com",
    phone: "11555555555",
     photo:
      "https://images.pexels.com/photos/428328/pexels-photo-428328.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
];

export const subjectData = [
  {
  id: 1,
  name: "Ministério Infantil",
  members: ["João Silva", "Maria Santos"], // ✅ Array de nomes dos membros
}
]



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

export const eventsData = [
  {
    id: 1,
    title: "Annual General Meeting",
    description: "Yearly meeting to discuss society goals and elect new board members",
    date: new Date("2024-03-15"),
    startTime: new Date("2024-03-15T14:00:00"),
    endTime: new Date("2024-03-15T16:00:00"),
    isPublic: false,
    societyId: 1,
    society: {
      id: 1,
      name: "Computer Science Society"
    }
  },
  {
    id: 2,
    title: "Tech Workshop: Introduction to React",
    description: "Learn the basics of React and build your first component",
    date: new Date("2024-03-20"),
    startTime: new Date("2024-03-20T18:00:00"),
    endTime: new Date("2024-03-20T20:00:00"),
    isPublic: true,
    societyId: 1,
    society: {
      id: 1,
      name: "Computer Science Society"
    }
  },
  {
    id: 3,
    title: "Spring Festival",
    description: null,
    date: new Date("2024-04-05"),
    startTime: new Date("2024-04-05T10:00:00"),
    endTime: new Date("2024-04-05T22:00:00"),
    isPublic: true,
    societyId: null,
    society: null
  },
  {
    id: 4,
    title: "Networking Night",
    description: "Connect with alumni and industry professionals",
    date: new Date("2024-03-25"),
    startTime: new Date("2024-03-25T19:00:00"),
    endTime: new Date("2024-03-25T21:30:00"),
    isPublic: false,
    societyId: 2,
    society: {
      id: 2,
      name: "Business Club"
    }
  },
  {
    id: 5,
    title: "Hackathon 2024",
    description: "24-hour coding challenge with amazing prizes and free food",
    date: new Date("2024-04-12"),
    startTime: new Date("2024-04-12T09:00:00"),
    endTime: new Date("2024-04-13T09:00:00"),
    isPublic: true,
    societyId: 1,
    society: {
      id: 1,
      name: "Computer Science Society"
    }
  },
  {
    id: 6,
    title: "Career Fair",
    description: "Meet with top employers and explore internship opportunities",
    date: new Date("2024-03-28"),
    startTime: new Date("2024-03-28T11:00:00"),
    endTime: new Date("2024-03-28T16:00:00"),
    isPublic: true,
    societyId: null,
    society: null
  },
  {
    id: 7,
    title: "Photography Exhibition",
    description: "Showcase of student photography work from the past semester",
    date: new Date("2024-04-08"),
    startTime: null,
    endTime: null,
    isPublic: true,
    societyId: 3,
    society: {
      id: 3,
      name: "Arts Society"
    }
  },
  {
    id: 8,
    title: "Study Group Session",
    description: "Collaborative study session for upcoming exams",
    date: new Date("2024-03-18"),
    startTime: new Date("2024-03-18T15:00:00"),
    endTime: new Date("2024-03-18T18:00:00"),
    isPublic: false,
    societyId: 1,
    society: {
      id: 1,
      name: "Computer Science Society"
    }
  },
  {
    id: 9,
    title: "Guest Lecture: AI in Healthcare",
    description: "Dr. Sarah Johnson discusses the future of artificial intelligence in medicine",
    date: new Date("2024-04-02"),
    startTime: new Date("2024-04-02T17:00:00"),
    endTime: new Date("2024-04-02T18:30:00"),
    isPublic: true,
    societyId: 4,
    society: {
      id: 4,
      name: "Medical Society"
    }
  },
  {
    id: 10,
    title: "Movie Night",
    description: null,
    date: new Date("2024-03-22"),
    startTime: new Date("2024-03-22T20:00:00"),
    endTime: new Date("2024-03-22T23:00:00"),
    isPublic: true,
    societyId: null,
    society: null
  }
];



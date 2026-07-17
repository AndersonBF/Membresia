# Membresia

Sistema de gestão de membresia para igrejas presbiterianas. Centraliza cadastro de membros, controle de presença, agenda de eventos, finanças, diaconia e as sociedades internas (UMP, UPA, UPH, SAF, UCP e EBD) em um único painel, com acesso separado por papel.

<!-- Substitua pelo print da tela principal do painel administrativo -->
![Painel administrativo do Membresia](docs/screenshots/dashboard-admin.png)

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Rodando localmente](#rodando-localmente)
- [Estrutura do projeto](#estrutura-do-projeto)

## Funcionalidades

### Gestão de membros

Cadastro completo com foto, dados de contato, histórico de frequência e vínculos com conselho, diaconia, ministérios e sociedades internas.

![Listagem de membros](docs/screenshots/membros.png)

### Controle de presença

Registro de frequência por evento, com ranking individual e exportação para Excel.

| Tomada de presença | Relatório de frequência |
|---|---|
| ![Tela de tomada de presença](docs/screenshots/presenca-take.png) | ![Relatório de presença](docs/screenshots/presenca-relatorio.png) |

### Eventos e calendário

Agenda centralizada por sociedade, com cultos, reuniões e controle de inscrições. Calendário geral consolida a programação de toda a igreja.

![Calendário de eventos](docs/screenshots/eventos.png)

### Diaconia

Módulo próprio com escala de trabalho, inventário de bens (com estado de conservação) e quadro de tarefas com prioridade e status.

| Escala | Inventário | Tarefas |
|---|---|---|
| ![Escala da diaconia](docs/screenshots/diaconia-escala.png) | ![Inventário](docs/screenshots/diaconia-inventario.png) | ![Tarefas](docs/screenshots/diaconia-tarefas.png) |

### Sociedades internas

UMP, UPA, UPH, SAF, UCP e EBD, cada uma com diretoria, membros, galeria, relatórios e agenda própria.

![Página de uma sociedade interna](docs/screenshots/sociedade.png)

### Finanças

Entradas e saídas por sociedade, com relatórios gráficos e balanço mensal.

![Painel financeiro](docs/screenshots/financas.png)

### Outros módulos

- **Comunicados e mural** — avisos direcionados a grupos específicos ou à congregação inteira, com reações.
- **Documentos** — atas, relatórios anuais e materiais de estudo.
- **Sermões** — registro e consulta de pregações.
- **Galeria** — álbuns de fotos por ministério e sociedade.
- **Escola Bíblica** — classes, professores e matrículas.
- **Aprovações** — fluxo administrativo para novos cadastros.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL + Prisma ORM |
| Autenticação | Clerk |
| Estilo | Tailwind CSS |
| Upload de mídia | Cloudinary |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Exportação | ExcelJS, docx |

## Rodando localmente

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Uma conta no [Clerk](https://clerk.com) e outra no [Cloudinary](https://cloudinary.com)

### Passo a passo

**1. Clone o repositório**

```bash
git clone https://github.com/AndersonBF/Membresia.git
cd Membresia
```

**2. Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/church"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
CLOUDINARY_UPLOAD_PRESET="..."
```

> O `.env` está no `.gitignore` e não deve ser versionado.

**3. Suba os containers**

```bash
npm run docker:up
```

Isso levanta o PostgreSQL e a aplicação. O container da app já roda `npm install`, aplica o schema do Prisma e inicia o servidor de desenvolvimento.

**4. Popule o banco com dados de exemplo**

```bash
docker exec membresia-app npx prisma db seed
```

**5. Acesse**

A aplicação fica disponível em **http://localhost:5555**.

### Comandos úteis

```bash
npm run docker:up        # sobe os containers
npm run docker:down      # derruba os containers
npm run prisma:migrate   # roda as migrations
npm run prisma:studio    # abre o Prisma Studio
npm run prisma:generate  # regenera o client do Prisma
npm run lint             # roda o ESLint
```

## Estrutura do projeto

```
Membresia/
├── prisma/
│   ├── schema.prisma          # modelo de dados
│   ├── migrations/            # histórico de migrations
│   └── seed.ts                # dados de exemplo
├── public/                    # ícones e imagens da aplicação
├── docs/screenshots/          # imagens usadas neste README
└── src/
    ├── app/
    │   ├── (auth)/            # login e cadastro
    │   ├── (dashboard)/       # painel autenticado
    │   │   ├── [role]/        # rotas por papel (admin, member, parent)
    │   │   ├── diaconia/      # escala, inventário e tarefas
    │   │   ├── list/          # listagens (membros, presença, eventos, finanças…)
    │   │   └── ministerio/    # ministérios e galerias
    │   └── api/               # route handlers
    ├── components/            # componentes de UI e formulários
    └── lib/                   # server actions, schemas de validação e utilitários
```

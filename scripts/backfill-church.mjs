// scripts/backfill-church.mjs
// Marca todos os usuários do Clerk que ainda NÃO têm `church` com o slug informado.
// Rode UMA vez para amarrar os membros atuais da IPB Toledo:
//   node scripts/backfill-church.mjs ipbtoledo
import "dotenv/config"
import { createClerkClient } from "@clerk/backend"

const slug = process.argv[2]
if (!slug) {
  console.error("Uso: node scripts/backfill-church.mjs <slug>   (ex.: ipbtoledo)")
  process.exit(1)
}
if (!process.env.CLERK_SECRET_KEY) {
  console.error("CLERK_SECRET_KEY não definido no ambiente/.env")
  process.exit(1)
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

let offset = 0
let updated = 0
const limit = 100

while (true) {
  const res = await clerk.users.getUserList({ limit, offset })
  const users = res.data ?? res
  if (!users || users.length === 0) break

  for (const u of users) {
    const meta = u.publicMetadata ?? {}
    if (!meta.church) {
      await clerk.users.updateUserMetadata(u.id, {
        publicMetadata: { ...meta, church: slug },
      })
      updated++
      console.log(`  • ${u.username ?? u.id} → church=${slug}`)
    }
  }
  offset += limit
}

console.log(`\n✅ ${updated} usuário(s) marcados com church="${slug}".`)

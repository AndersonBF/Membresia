import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server'
import { logLogin } from '@/lib/accessLog'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return new Response('Webhook secret not found', { status: 400 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    return new Response('Invalid webhook', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id } = evt.data
    const client = await clerkClient()

    // Preenche o papel padrão "member" SOMENTE se ainda não houver papéis —
    // sem sobrescrever roles/church já definidos (ex.: pelo create-member).
    const user = await client.users.getUser(id)
    const meta = (user.publicMetadata ?? {}) as { roles?: string[]; church?: string }
    if (!meta.roles || meta.roles.length === 0) {
      await client.users.updateUserMetadata(id, {
        publicMetadata: { ...meta, roles: ["member"] },
      })
    }
  }

  // Login: o Clerk dispara session.created quando o usuário entra.
  if (evt.type === 'session.created') {
    try {
      const userId = (evt.data as any).user_id as string
      const client = await clerkClient()
      const u = await client.users.getUser(userId)
      const meta = (u.publicMetadata ?? {}) as { roles?: string[]; church?: string }
      const userName =
        u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || userId

      await logLogin({
        userId,
        userName,
        roles: meta.roles ?? [],
        church: meta.church ?? null,
      })
    } catch {
      // não bloqueia o webhook
    }
  }

  return new Response('OK', { status: 200 })
}
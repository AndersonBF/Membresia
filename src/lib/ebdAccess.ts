import { currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

export type EbdAccess = {
  /** username Clerk do usuário logado (ou null) */
  username: string | null
  /** id do Member vinculado (via username), se houver */
  memberId: number | null
  isAdmin: boolean
  isSuperintendent: boolean
  /** admin, superadmin ou superintendente: enxerga todas as turmas */
  canSeeAll: boolean
  /** turmas em que o usuário é professora (ClassTeacher) */
  teacherClassIds: number[]
}

/**
 * Resolve o acesso do usuário logado à EBD.
 * - admin / superadmin / superintendente → canSeeAll = true
 * - professora → teacherClassIds via username → Member → ClassTeacher
 */
export async function getEbdAccess(): Promise<EbdAccess> {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []

  const isAdmin = roles.includes("admin") || roles.includes("superadmin")
  const isSuperintendent = roles.includes("superintendente")
  const canSeeAll = isAdmin || isSuperintendent

  const username = user?.username ?? null

  let memberId: number | null = null
  let teacherClassIds: number[] = []

  if (username) {
    const member = await prisma.member.findUnique({
      where: { username },
      select: { id: true, teachingAssignments: { select: { classId: true } } },
    })
    if (member) {
      memberId = member.id
      teacherClassIds = member.teachingAssignments.map((t) => t.classId)
    }
  }

  return { username, memberId, isAdmin, isSuperintendent, canSeeAll, teacherClassIds }
}

/** true se o usuário pode ver/gerir a turma informada */
export function canAccessClass(access: EbdAccess, classId: number): boolean {
  return access.canSeeAll || access.teacherClassIds.includes(classId)
}

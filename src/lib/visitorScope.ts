// src/lib/visitorScope.ts
//
// Escopo de visitantes: segue exatamente o mesmo padrão de Event —
// sociedades internas usam societyId; os demais grupos usam category
// ("ebd", "diaconia", "conselho", "ministerio"). Ambos nulos = igreja.

import { societyMap } from "@/lib/permissions"

export type VisitorScope = { societyId: number | null; category: string | null }

/** Roles de grupo que não são sociedades internas. */
export const CATEGORY_ROLES = ["ebd", "diaconia", "conselho", "ministerio"] as const

/** O role informado é um grupo válido (sociedade ou categoria)? */
export function isGroupRole(role: string): boolean {
  return !!societyMap[role] || (CATEGORY_ROLES as readonly string[]).includes(role)
}

/**
 * Grupos que não recebem visitantes — a diaconia é um corpo de serviço da
 * igreja, não uma sociedade que recebe visitas. Esconde a lista, o atalho,
 * o contador e o bloco de visitantes na chamada.
 */
const ROLES_WITHOUT_VISITORS = ["diaconia"]

export function roleHasVisitors(role: string): boolean {
  return !ROLES_WITHOUT_VISITORS.includes(role)
}

/** O evento pertence a um grupo que não recebe visitantes? */
export function eventHasVisitors(event: { societyId: number | null; category: string | null }): boolean {
  if (event.societyId) return true
  return !event.category || roleHasVisitors(event.category)
}

/** Converte um role de grupo (ump, ebd, …) no escopo de visitantes. */
export function scopeForRole(role: string): VisitorScope {
  if (societyMap[role]) return { societyId: societyMap[role], category: null }
  if ((CATEGORY_ROLES as readonly string[]).includes(role)) return { societyId: null, category: role }
  return { societyId: null, category: null }
}

/** `where` do Prisma para listar os visitantes de um escopo. */
export function visitorWhereForScope(scope: VisitorScope) {
  return { societyId: scope.societyId, category: scope.category }
}

/**
 * Visitantes elegíveis para a chamada de um evento.
 * Evento de sociedade/grupo → só os visitantes daquele escopo.
 * Evento geral da igreja     → todos os visitantes (qualquer escopo).
 */
export function visitorWhereForEvent(event: { societyId: number | null; category: string | null }) {
  if (event.societyId) return { societyId: event.societyId, isActive: true }
  if (event.category) return { category: event.category, isActive: true }
  return { isActive: true }
}

/** Escopo atribuído a um visitante criado durante a chamada de um evento. */
export function scopeForEvent(event: { societyId: number | null; category: string | null }): VisitorScope {
  return { societyId: event.societyId ?? null, category: event.societyId ? null : event.category ?? null }
}

// src/lib/pastorDiary.ts
// Constantes compartilhadas do Diário do Pastor (usadas por rotas de API e UI).
export const DIARY_CATEGORIES = ["Visita", "Aconselhamento", "Culto", "Reunião", "Outro"] as const
export type DiaryCategory = (typeof DIARY_CATEGORIES)[number]

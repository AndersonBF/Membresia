// src/lib/societyAccent.ts
// Cores de destaque de cada sociedade — mesmas usadas em src/app/(dashboard)/[role]/page.tsx,
// para as páginas de Secretaria seguirem o visual da sociedade a que pertencem.
export const SOCIETY_ACCENT: Record<string, { color: string; light: string; dark: string }> = {
  ump: { color: "#2563eb", light: "#eff6ff", dark: "#1e3a8a" },
  upa: { color: "#d97706", light: "#fffbeb", dark: "#78350f" },
  uph: { color: "#ea580c", light: "#fff7ed", dark: "#7c2d12" },
  saf: { color: "#db2777", light: "#fdf2f8", dark: "#831843" },
  ucp: { color: "#f59e0b", light: "#fefce8", dark: "#78350f" },
}

export function accentFor(role: string) {
  return SOCIETY_ACCENT[role] ?? { color: "#0f766e", light: "#f0fdfa", dark: "#134e4a" }
}

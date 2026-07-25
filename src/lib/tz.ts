// src/lib/tz.ts
// Utilitários de fuso horário. O servidor (Vercel) roda em UTC e nao permite
// mudar TZ por env var, entao os limites de "dia" precisam ser calculados
// explicitamente no fuso do Brasil. Sao Paulo nao tem horario de verao desde
// 2019, mas o offset e calculado dinamicamente para robustez.

export const TZ = "America/Sao_Paulo"

// Offset em minutos tal que: horario_local = utc + offset. Para SP retorna -180.
function offsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
  const p = dtf.formatToParts(date).reduce<Record<string, string>>((a, x) => {
    a[x.type] = x.value
    return a
  }, {})
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return (asUTC - date.getTime()) / 60000
}

// Ano/mes/dia do instante conforme o calendario de Sao Paulo.
export function spParts(date: Date): { year: number; month: number; day: number } {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date).reduce<Record<string, string>>((a, x) => {
    a[x.type] = x.value
    return a
  }, {})
  return { year: +p.year, month: +p.month, day: +p.day }
}

// Instante (Date absoluto) da meia-noite, em SP, do dia que contem `date`.
export function startOfDaySP(date: Date): Date {
  const { year, month, day } = spParts(date)
  const guess = Date.UTC(year, month - 1, day, 0, 0, 0, 0)
  const off = offsetMinutes(new Date(guess))
  return new Date(guess - off * 60000)
}

// Soma dias a um instante de inicio-de-dia SP (SP nao tem DST, 24h e seguro).
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000)
}

import type { DateRecord } from './types'

export function formatCost(cost: number): string {
  return cost.toFixed(2)
}

function sumItems(arr: { cost?: number }[]) {
  return arr.reduce((s, it) => s + (it.cost ?? 0), 0)
}

function sumByPaidBy<T extends { cost?: number; paidBy?: string }>(arr: T[], who: string) {
  return arr.filter((it) => it.paidBy === who).reduce((s, it) => s + (it.cost ?? 0), 0)
}

export function getDateTotalCost(d: DateRecord): number {
  return sumItems(d.items) + sumItems(d.miscExpenses ?? [])
}

export function getDateCostByMe(d: DateRecord): number {
  return sumByPaidBy(d.items, 'me') + sumByPaidBy(d.miscExpenses ?? [], 'me')
}

export function getDateCostByThem(d: DateRecord): number {
  return sumByPaidBy(d.items, 'them') + sumByPaidBy(d.miscExpenses ?? [], 'them')
}

export function getAgeFromBirthDate(birthDate: string): number | undefined {
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return undefined
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 ? age : undefined
}

export function getDateSummary(d: DateRecord): string {
  if (d.items.length === 0) return '无行程'
  if (d.items.length === 1) {
    const it = d.items[0]
    return [it.location, it.activity].filter(Boolean).join(' · ') || it.activity
  }
  return d.items.map((it) => it.activity).join(' → ')
}

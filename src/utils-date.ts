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

export function getDateSummary(d: DateRecord): string {
  if (d.items.length === 0) return '无行程'
  if (d.items.length === 1) {
    const it = d.items[0]
    return [it.location, it.activity].filter(Boolean).join(' · ') || it.activity
  }
  return d.items.map((it) => it.activity).join(' → ')
}

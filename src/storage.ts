import type {
  PersonInfo,
  DateRecord,
  DateRecordItem,
  Milestone,
  Impression,
  PendingQuestion,
  NextPlan,
  Decision,
  Reminder,
} from './types'
import { id } from './utils'

export const STORAGE_KEYS = {
  persons: 'love-ops-persons',
  dates: 'love-ops-dates',
  milestones: 'love-ops-milestones',
  impressions: 'love-ops-impressions',
  questions: 'love-ops-questions',
  plans: 'love-ops-plans',
  decisions: 'love-ops-decisions',
  reminders: 'love-ops-reminders',
} as const

export interface BackupData {
  version: number
  exportedAt: string
  persons: PersonInfo[]
  dates: DateRecord[]
  milestones: Milestone[]
  impressions: Impression[]
  questions: PendingQuestion[]
  plans: NextPlan[]
  decisions: Decision[]
  reminders: Reminder[]
}

export function exportBackup(): BackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    persons: db.persons.getAll(),
    dates: db.dates.getAll(),
    milestones: db.milestones.getAll(),
    impressions: db.impressions.getAll(),
    questions: db.questions.getAll(),
    plans: db.plans.getAll(),
    decisions: db.decisions.getAll(),
    reminders: db.reminders.getAll(),
  }
}

export function importBackup(data: BackupData): { ok: boolean; error?: string } {
  try {
    if (!data.version || !Array.isArray(data.persons)) {
      return { ok: false, error: '无效的备份文件格式' }
    }
    db.persons.save(data.persons ?? [])
    db.dates.save(data.dates ?? [])
    db.milestones.save(data.milestones ?? [])
    db.impressions.save(data.impressions ?? [])
    db.questions.save(data.questions ?? [])
    db.plans.save(data.plans ?? [])
    db.decisions.save(data.decisions ?? [])
    db.reminders.save(data.reminders ?? [])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

function load<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

// 将旧版 DateRecord 迁移为新版（items + miscExpenses）
function migrateDateRecord(d: Record<string, unknown>): DateRecord {
  const ensureMisc = (rec: DateRecord) => ({
    ...rec,
    miscExpenses: rec.miscExpenses ?? [],
    tags: rec.tags ?? [],
    initiatedBy: rec.initiatedBy ?? undefined,
  })
  if (Array.isArray(d.items) && d.items.length > 0) {
    return ensureMisc(d as unknown as DateRecord)
  }
  const legacy = d as unknown as { location?: string; activity?: string; cost?: number; paidBy?: string; time?: string }
  const item: DateRecordItem = {
    id: id(),
    time: legacy.time,
    location: legacy.location ?? undefined,
    activity: legacy.activity ?? '未填写',
    cost: legacy.cost,
    paidBy: legacy.paidBy as DateRecordItem['paidBy'],
  }
  return ensureMisc({
    ...d,
    items: [item],
    miscExpenses: [],
    notes: (d.notes as string) ?? '',
    photos: Array.isArray(d.photos) ? d.photos : [],
    tags: Array.isArray((d as { tags?: string[] }).tags) ? (d as { tags: string[] }).tags : [],
  } as unknown as DateRecord)
}

function loadDates(): DateRecord[] {
  const raw = load<Record<string, unknown>[]>(STORAGE_KEYS.dates, [])
  const migrated = raw.map(migrateDateRecord)
  if (migrated.some((m, i) => JSON.stringify(m) !== JSON.stringify(raw[i]))) {
    save(STORAGE_KEYS.dates, migrated)
  }
  return migrated
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export const db = {
  persons: {
    getAll: () => load<PersonInfo[]>(STORAGE_KEYS.persons, []),
    save: (list: PersonInfo[]) => save(STORAGE_KEYS.persons, list),
    add: (p: PersonInfo) => {
      const list = db.persons.getAll()
      list.push(p)
      db.persons.save(list)
      return p
    },
    update: (id: string, updater: (p: PersonInfo) => PersonInfo) => {
      const list = db.persons.getAll()
      const i = list.findIndex((x) => x.id === id)
      if (i >= 0) {
        list[i] = updater(list[i])
        db.persons.save(list)
      }
    },
    get: (id: string) => db.persons.getAll().find((x) => x.id === id),
    delete: (id: string) => {
      const list = db.persons.getAll().filter((x) => x.id !== id)
      db.persons.save(list)
    },
    deleteWithData: (personId: string) => {
      db.dates.save(db.dates.getAll().filter((d) => d.personId !== personId))
      db.milestones.save(db.milestones.getAll().filter((m) => m.personId !== personId))
      db.impressions.save(db.impressions.getAll().filter((i) => i.personId !== personId))
      db.questions.save(db.questions.getAll().filter((q) => q.personId !== personId))
      db.plans.save(db.plans.getAll().filter((p) => p.personId !== personId))
      db.decisions.save(db.decisions.getAll().filter((d) => d.personId !== personId))
      db.reminders.save(db.reminders.getAll().filter((r) => r.personId !== personId))
      db.persons.delete(personId)
    },
  },
  dates: {
    getAll: () => loadDates(),
    getByPerson: (personId: string) =>
      db.dates.getAll().filter((d) => d.personId === personId).sort((a, b) => b.date.localeCompare(a.date)),
    save: (list: DateRecord[]) => save(STORAGE_KEYS.dates, list),
    add: (d: DateRecord) => {
      const list = db.dates.getAll()
      list.push(d)
      db.dates.save(list)
      return d
    },
    update: (id: string, updater: (d: DateRecord) => DateRecord) => {
      const list = db.dates.getAll()
      const i = list.findIndex((x) => x.id === id)
      if (i >= 0) {
        list[i] = updater(list[i])
        db.dates.save(list)
      }
    },
    delete: (id: string) => {
      db.dates.save(db.dates.getAll().filter((x) => x.id !== id))
    },
  },
  milestones: {
    getByPerson: (personId: string) =>
      db.milestones.getAll().filter((m) => m.personId === personId).sort((a, b) => a.date.localeCompare(b.date)),
    getAll: () => load<Milestone[]>(STORAGE_KEYS.milestones, []),
    save: (list: Milestone[]) => save(STORAGE_KEYS.milestones, list),
    add: (m: Milestone) => {
      const list = db.milestones.getAll()
      list.push(m)
      db.milestones.save(list)
      return m
    },
    delete: (id: string) => {
      db.milestones.save(db.milestones.getAll().filter((x) => x.id !== id))
    },
  },
  impressions: {
    getByPerson: (personId: string) => db.impressions.getAll().find((i) => i.personId === personId),
    getAll: () => load<Impression[]>(STORAGE_KEYS.impressions, []),
    save: (list: Impression[]) => save(STORAGE_KEYS.impressions, list),
    upsert: (imp: Impression) => {
      const list = db.impressions.getAll()
      const i = list.findIndex((x) => x.personId === imp.personId)
      if (i >= 0) list[i] = imp
      else list.push(imp)
      db.impressions.save(list)
      return imp
    },
  },
  questions: {
    getByPerson: (personId: string) =>
      db.questions.getAll().filter((q) => q.personId === personId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getAll: () => load<PendingQuestion[]>(STORAGE_KEYS.questions, []),
    save: (list: PendingQuestion[]) => save(STORAGE_KEYS.questions, list),
    add: (q: PendingQuestion) => {
      const list = db.questions.getAll()
      list.push(q)
      db.questions.save(list)
      return q
    },
    update: (id: string, updater: (q: PendingQuestion) => PendingQuestion) => {
      const list = db.questions.getAll()
      const i = list.findIndex((x) => x.id === id)
      if (i >= 0) {
        list[i] = updater(list[i])
        db.questions.save(list)
      }
    },
    delete: (id: string) => {
      db.questions.save(db.questions.getAll().filter((x) => x.id !== id))
    },
  },
  plans: {
    getByPerson: (personId: string) =>
      db.plans.getAll().filter((p) => p.personId === personId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0],
    getAll: () => load<NextPlan[]>(STORAGE_KEYS.plans, []),
    save: (list: NextPlan[]) => save(STORAGE_KEYS.plans, list),
    upsert: (p: NextPlan) => {
      const list = db.plans.getAll().filter((x) => x.personId !== p.personId)
      list.push(p)
      db.plans.save(list)
      return p
    },
    delete: (id: string) => {
      db.plans.save(db.plans.getAll().filter((x) => x.id !== id))
    },
  },
  decisions: {
    getByPerson: (personId: string) =>
      db.decisions.getAll().filter((d) => d.personId === personId).sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))[0],
    getAll: () => load<Decision[]>(STORAGE_KEYS.decisions, []),
    save: (list: Decision[]) => save(STORAGE_KEYS.decisions, list),
    add: (d: Decision) => {
      const list = db.decisions.getAll()
      list.push(d)
      db.decisions.save(list)
      return d
    },
  },
  reminders: {
    getByPerson: (personId: string) =>
      db.reminders.getAll().filter((r) => r.personId === personId).sort((a, b) => a.date.localeCompare(b.date)),
    getAll: () => load<Reminder[]>(STORAGE_KEYS.reminders, []),
    save: (list: Reminder[]) => save(STORAGE_KEYS.reminders, list),
    add: (r: Reminder) => {
      const list = db.reminders.getAll()
      list.push(r)
      db.reminders.save(list)
      return r
    },
    update: (id: string, updater: (r: Reminder) => Reminder) => {
      const list = db.reminders.getAll()
      const i = list.findIndex((x) => x.id === id)
      if (i >= 0) {
        list[i] = updater(list[i])
        db.reminders.save(list)
      }
    },
    delete: (id: string) => {
      db.reminders.save(db.reminders.getAll().filter((x) => x.id !== id))
    },
  },
}

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { PersonInfo } from '../types'
import { db } from '../storage'

interface Props {
  persons: PersonInfo[]
}

export default function ReminderCheck({ persons }: Props) {
  const [show, setShow] = useState(false)
  const [reminders, setReminders] = useState<{ id: string; title: string; date: string; personName: string }[]>([])

  useEffect(() => {
    const all = db.reminders.getAll()
    const today = format(new Date(), 'yyyy-MM-dd')
    const pending = all
      .filter((r) => !r.triggered && r.date <= today)
      .map((r) => {
        const p = persons.find((x) => x.id === r.personId)
        return { id: r.id, title: r.title, date: r.date, personName: p?.name ?? '?' }
      })
    setReminders(pending)
    setShow(pending.length > 0)
  }, [persons])

  const dismiss = (id: string) => {
    db.reminders.update(id, (r) => ({ ...r, triggered: true }))
    setReminders((prev) => prev.filter((r) => r.id !== id))
    if (reminders.length <= 1) setShow(false)
  }

  if (!show || reminders.length === 0) return null

  return (
    <div className="reminder-toast">
      <div className="reminder-toast-inner">
        <h4>今日提醒</h4>
        {reminders.map((r) => (
          <div key={r.id} className="reminder-toast-item">
            <span>{r.personName} - {r.title}</span>
            <span className="muted">{format(new Date(r.date), 'M月d日', { locale: zhCN })}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => dismiss(r.id)}>完成</button>
          </div>
        ))}
      </div>
    </div>
  )
}

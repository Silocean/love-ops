import { useState } from 'react'
import { Bell } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Reminder } from '../types'
import { db } from '../storage'
import { id, now } from '../utils'

interface Props {
  personId: string
  reminders: Reminder[]
  onRefresh: () => void
}

export default function ReminderSection({ personId, reminders, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  const add = () => {
    if (!title.trim()) return
    db.reminders.add({
      id: id(),
      personId,
      title: title.trim(),
      date,
      time: time || undefined,
      notes: notes || undefined,
      triggered: false,
      createdAt: now(),
    })
    setTitle('')
    setDate(new Date().toISOString().slice(0, 10))
    setTime('')
    setNotes('')
    setShowForm(false)
    onRefresh()
  }

  const trigger = (r: Reminder) => {
    db.reminders.update(r.id, (x) => ({ ...x, triggered: true }))
    onRefresh()
  }

  const remove = (id: string) => {
    db.reminders.delete(id)
    onRefresh()
  }

  const pending = reminders.filter((r) => !r.triggered)

  return (
    <section className="detail-section card">
      <div className="section-header">
        <h3><Bell size={18} /> 提醒</h3>
        {!showForm ? (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>添加</button>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>取消</button>
        )}
      </div>

      {showForm && (
        <div className="reminder-form">
          <div className="form-row">
            <label>提醒内容</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：下次约会" />
          </div>
          <div className="form-row two-cols">
            <div>
              <label>日期</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label>时间</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="可选" />
            </div>
          </div>
          <div className="form-row">
            <label>备注</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={add}>添加提醒</button>
        </div>
      )}

      {pending.length === 0 && !showForm ? (
        <p className="empty-hint">暂无提醒</p>
      ) : (
        <ul className="reminder-list">
          {pending.map((r) => (
            <li key={r.id}>
              <div className="reminder-main">
                <strong>{r.title}</strong>
                <span className="reminder-date">
                  {format(new Date(r.date), 'M月d日', { locale: zhCN })}
                  {r.time && ` ${r.time}`}
                </span>
              </div>
              {r.notes && <p className="reminder-notes">{r.notes}</p>}
              <div className="reminder-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => trigger(r)}>已完成</button>
                <button className="remove-item" onClick={() => remove(r.id)}>×</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

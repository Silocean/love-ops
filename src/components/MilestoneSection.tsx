import { useState } from 'react'
import { Target } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Milestone } from '../types'
import { db } from '../storage'
import { id, now } from '../utils'

interface Props {
  personId: string
  milestones: Milestone[]
  onRefresh: () => void
}

export default function MilestoneSection({ personId, milestones, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  const add = () => {
    if (!title.trim()) return
    db.milestones.add({
      id: id(),
      personId,
      title: title.trim(),
      date,
      notes: notes || undefined,
      createdAt: now(),
    })
    setTitle('')
    setDate(new Date().toISOString().slice(0, 10))
    setNotes('')
    setShowForm(false)
    onRefresh()
  }

  const remove = (id: string) => {
    db.milestones.delete(id)
    onRefresh()
  }

  return (
    <section className="detail-section card">
      <div className="section-header">
        <h3><Target size={18} /> 重要节点</h3>
        {!showForm ? (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>添加</button>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>取消</button>
        )}
      </div>

      {showForm && (
        <div className="inline-form">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：第一次见面" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="备注" />
          <button className="btn btn-primary btn-sm" onClick={add}>保存</button>
        </div>
      )}

      {milestones.length === 0 && !showForm ? (
        <p className="empty-hint">暂无重要节点</p>
      ) : (
        <ul className="milestone-list">
          {milestones.map((m) => (
            <li key={m.id}>
              <span className="ms-date">{format(new Date(m.date), 'yyyy年M月d日', { locale: zhCN })}</span>
              <span className="ms-title">{m.title}</span>
              {m.notes && <span className="ms-notes">{m.notes}</span>}
              <button type="button" className="remove-item" onClick={() => remove(m.id)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

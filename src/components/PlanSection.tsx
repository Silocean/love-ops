import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import type { NextPlan } from '../types'
import { db } from '../storage'
import { id, now } from '../utils'

interface Props {
  personId: string
  plan: NextPlan | undefined
  onRefresh: () => void
}

export default function PlanSection({ personId, plan, onRefresh }: Props) {
  const [editing, setEditing] = useState(!plan)
  const [plannedDate, setPlannedDate] = useState(plan?.plannedDate ?? '')
  const [plannedLocation, setPlannedLocation] = useState(plan?.plannedLocation ?? '')
  const [plannedActivity, setPlannedActivity] = useState(plan?.plannedActivity ?? '')
  const [notes, setNotes] = useState(plan?.notes ?? '')

  const save = () => {
    const ts = now()
    db.plans.upsert({
      id: plan?.id ?? id(),
      personId,
      plannedDate: plannedDate || undefined,
      plannedLocation: plannedLocation || undefined,
      plannedActivity: plannedActivity || undefined,
      notes: notes || undefined,
      createdAt: plan?.createdAt ?? ts,
      updatedAt: ts,
    })
    setEditing(false)
    onRefresh()
  }

  const cancel = () => {
    setPlannedDate(plan?.plannedDate ?? '')
    setPlannedLocation(plan?.plannedLocation ?? '')
    setPlannedActivity(plan?.plannedActivity ?? '')
    setNotes(plan?.notes ?? '')
    setEditing(false)
  }

  return (
    <section className="detail-section card">
      <div className="section-header">
        <h3><CalendarClock size={18} /> 下次约会计划</h3>
        {!editing ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>编辑</button>
        ) : (
          <div>
            <button className="btn btn-ghost btn-sm" onClick={cancel}>取消</button>
            <button className="btn btn-primary btn-sm" onClick={save}>保存</button>
          </div>
        )}
      </div>

      {!plan && !editing ? (
        <p className="empty-hint">暂无计划，点击编辑添加</p>
      ) : editing ? (
        <div className="plan-form">
          <div className="form-row">
            <label>计划日期</label>
            <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
          </div>
          <div className="form-row">
            <label>地点</label>
            <input value={plannedLocation} onChange={(e) => setPlannedLocation(e.target.value)} placeholder="约会地点" />
          </div>
          <div className="form-row">
            <label>活动</label>
            <input value={plannedActivity} onChange={(e) => setPlannedActivity(e.target.value)} placeholder="计划活动" />
          </div>
          <div className="form-row">
            <label>备注</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
      ) : (
        <div className="plan-display">
          {plan?.plannedDate && <p><strong>日期：</strong>{plan.plannedDate}</p>}
          {plan?.plannedLocation && <p><strong>地点：</strong>{plan.plannedLocation}</p>}
          {plan?.plannedActivity && <p><strong>活动：</strong>{plan.plannedActivity}</p>}
          {plan?.notes && <p><strong>备注：</strong>{plan.notes}</p>}
        </div>
      )}
    </section>
  )
}

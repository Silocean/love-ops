import { useState } from 'react'
import { Heart } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Decision } from '../types'
import { db } from '../storage'
import { id, now } from '../utils'
import { DECISION_LABELS } from '../constants'
import type { ContinueDecision } from '../types'

interface Props {
  personId: string
  decision: Decision | undefined
  onRefresh: () => void
}

export default function DecisionSection({ personId, decision, onRefresh }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState<ContinueDecision>(decision?.decision ?? 'undecided')
  const [reason, setReason] = useState(decision?.reason ?? '')

  const save = () => {
    db.decisions.add({
      id: id(),
      personId,
      decision: value,
      reason: reason || undefined,
      decidedAt: now(),
    })
    setEditing(false)
    onRefresh()
  }

  return (
    <section className="detail-section card">
      <div className="section-header">
        <h3><Heart size={18} /> 是否继续</h3>
        {!editing ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
            {decision ? '更新' : '记录'}
          </button>
        ) : (
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>取消</button>
            <button className="btn btn-primary btn-sm" onClick={save}>保存</button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="decision-form">
          <div className="form-row">
            <label>决定</label>
            <select value={value} onChange={(e) => setValue(e.target.value as ContinueDecision)}>
              {Object.entries(DECISION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>原因/备注</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
        </div>
      ) : decision ? (
        <div className="decision-display">
          <p><strong>{DECISION_LABELS[decision.decision]}</strong></p>
          {decision.reason && <p>{decision.reason}</p>}
          <p className="muted">{format(new Date(decision.decidedAt), 'yyyy年M月d日', { locale: zhCN })}</p>
        </div>
      ) : (
        <p className="empty-hint">暂无决定</p>
      )}
    </section>
  )
}

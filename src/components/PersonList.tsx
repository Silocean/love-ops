import { Plus, ChevronRight } from 'lucide-react'
import type { PersonInfo } from '../types'
import { db } from '../storage'
import { STAGE_LABELS } from '../constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  persons: PersonInfo[]
  onSelect: (p: PersonInfo) => void
  onAdd: () => void
  onEdit: (p: PersonInfo) => void
}

export default function PersonList({ persons, onSelect, onAdd }: Props) {
  const stageKey = 'stage' as keyof PersonInfo
  // We'll store stage in a simple way - for now assume we have a stage field
  // We need to add stage to PersonInfo - let me check types
  return (
    <div className="page person-list-page">
      <div className="page-header">
        <h2>相亲人选</h2>
        <button className="btn btn-primary" onClick={onAdd}>
          <Plus size={18} />
          添加人选
        </button>
      </div>
      {persons.length === 0 ? (
        <div className="empty-state">
          <p>还没有添加人选，点击上方按钮开始记录</p>
        </div>
      ) : (
        <div className="person-cards">
          {persons.map((p) => {
            const dates = db.dates.getByPerson(p.id)
            const lastDate = dates[0]
            const stage = (p as PersonInfo & { stage?: string })?.stage
            return (
              <div
                key={p.id}
                className="person-card card"
                onClick={() => onSelect(p)}
              >
                <div className="person-card-avatar">
                  {p.photos[0] ? (
                    <img src={p.photos[0]} alt={p.name} />
                  ) : (
                    <span className="avatar-placeholder">{p.name[0]}</span>
                  )}
                </div>
                <div className="person-card-body">
                  <h3>{p.name}</h3>
                  {(p.age || p.job) && (
                    <p className="person-meta">
                      {[p.age && `${p.age}岁`, p.job].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {stage && (
                    <span className="stage-badge">{STAGE_LABELS[stage as keyof typeof STAGE_LABELS] || stage}</span>
                  )}
                  {lastDate && (
                    <p className="last-date">
                      最近约会：{format(new Date(lastDate.date), 'M月d日', { locale: zhCN })}
                    </p>
                  )}
                </div>
                <ChevronRight size={20} className="chevron" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

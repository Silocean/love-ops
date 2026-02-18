import { useState, useLayoutEffect } from 'react'
import { ArrowLeft, Plus, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { PersonInfo } from '../types'
import { db } from '../storage'
import { getDateTotalCost, getDateCostByMe, getDateCostByThem, getDateSummary, formatCost } from '../utils-date'
import { STAGE_LABELS, PAID_BY_LABELS } from '../constants'
import ImpressionSection from './ImpressionSection'
import MilestoneSection from './MilestoneSection'
import QuestionsSection from './QuestionsSection'
import PlanSection from './PlanSection'
import DecisionSection from './DecisionSection'
import ReminderSection from './ReminderSection'
import PhotoViewer from './PhotoViewer'
import AnniversarySuggestions from './AnniversarySuggestions'
import ConfirmModal from './ConfirmModal'

interface Props {
  person: PersonInfo
  highlightDateId?: string | null
  onHighlightDone?: () => void
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onAddDate: () => void
  onEditDate: (dateId: string) => void
  onRefresh: () => void
}

export default function PersonDetail({ person, highlightDateId, onHighlightDone, onBack, onEdit, onDelete, onAddDate, onEditDate, onRefresh }: Props) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [datesSectionCollapsed, setDatesSectionCollapsed] = useState(false)
  const [photoViewer, setPhotoViewer] = useState<{ photos: string[]; index: number } | null>(null)
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false)
  const [confirmDeletePerson, setConfirmDeletePerson] = useState(false)
  const [confirmDeleteDate, setConfirmDeleteDate] = useState<{ dateId: string } | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const dates = db.dates.getByPerson(person.id)

  useLayoutEffect(() => {
    if (!highlightDateId) return
    setDatesSectionCollapsed(false)
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      next.delete(highlightDateId)
      return next
    })
    setHighlightId(highlightDateId)
  }, [highlightDateId])

  useLayoutEffect(() => {
    if (!highlightDateId) return
    const scrollAndHighlight = () => {
      const el = document.querySelector(`[data-date-id="${highlightDateId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollAndHighlight)
    })
    const t = setTimeout(() => {
      setHighlightId(null)
      onHighlightDone?.()
    }, 2200)
    return () => clearTimeout(t)
  }, [highlightDateId, onHighlightDone])

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const impression = db.impressions.getByPerson(person.id)
  const milestones = db.milestones.getByPerson(person.id)
  const questions = db.questions.getByPerson(person.id)
  const plan = db.plans.getByPerson(person.id)
  const decision = db.decisions.getByPerson(person.id)
  const reminders = db.reminders.getByPerson(person.id)

  const totalCost = dates.reduce((s, d) => s + getDateTotalCost(d), 0)
  const costByMe = dates.reduce((s, d) => s + getDateCostByMe(d), 0)
  const costByThem = dates.reduce((s, d) => s + getDateCostByThem(d), 0)
  const totalDates = dates.length

  return (
    <div className="page detail-page">
      <div className="page-header">
        <button className="btn btn-ghost icon-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2>{person.name}</h2>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={onEdit}>编辑</button>
          <button
            className="btn btn-ghost icon-btn"
            onClick={() => setConfirmDeletePerson(true)}
            title="删除人选"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="detail-hero card">
        <div
          className={`detail-avatar ${person.photos.length > 0 ? 'clickable' : ''}`}
          onClick={() => person.photos.length > 0 && setAvatarViewerOpen(true)}
          role={person.photos.length > 0 ? 'button' : undefined}
        >
          {person.photos[0] ? (
            <img src={person.photos[0]} alt={person.name} />
          ) : (
            <span className="avatar-placeholder large">{person.name[0]}</span>
          )}
        </div>
        <div className="detail-meta">
          <h3>{person.name}</h3>
          {(person.age || person.job) && (
            <p className="meta-line">
              {[person.age && `${person.age}岁`, person.job].filter(Boolean).join(' · ')}
            </p>
          )}
          {person.stage && (
            <span className="stage-badge">{STAGE_LABELS[person.stage]}</span>
          )}
          <div className="stats-row">
            <span>约会 {totalDates} 次</span>
            {totalCost > 0 && (
              <>
                <span>累计 ¥{formatCost(totalCost)}</span>
                {costByMe > 0 && <span className="cost-me">我出 ¥{formatCost(costByMe)}</span>}
                {costByThem > 0 && <span className="cost-them">对方 ¥{formatCost(costByThem)}</span>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 约会记录 timeline */}
      <section className="detail-section card dates-section">
        <div
          className="section-header section-header-clickable"
          onClick={() => setDatesSectionCollapsed((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setDatesSectionCollapsed((v) => !v)}
        >
          <h3>
            <Calendar size={18} />
            约会记录
            {dates.length > 0 && (
              <span className="section-summary">（共 {dates.length} 次）</span>
            )}
            {datesSectionCollapsed ? (
              <ChevronDown size={18} className="section-chevron" />
            ) : (
              <ChevronUp size={18} className="section-chevron" />
            )}
          </h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.stopPropagation()
              onAddDate()
            }}
          >
            <Plus size={16} /> 添加约会
          </button>
        </div>
        {!datesSectionCollapsed && (
          dates.length === 0 ? (
            <p className="empty-hint">暂无约会记录</p>
          ) : (
          <>
          {dates.length > 0 && (
            <div className="timeline-toolbar">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCollapsedIds(new Set())}
              >
                展开全部
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCollapsedIds(new Set(dates.map((d) => d.id)))}
              >
                折叠全部
              </button>
            </div>
          )}
          <div className="timeline">
            {dates.map((d) => {
              const costMe = getDateCostByMe(d)
              const costThem = getDateCostByThem(d)
              const isCollapsed = collapsedIds.has(d.id)
              const isHighlighted = highlightId === d.id
              return (
              <div
                key={d.id}
                data-date-id={d.id}
                className={`timeline-item card ${isCollapsed ? 'collapsed' : ''} ${isHighlighted ? 'timeline-item-highlight' : ''}`}
              >
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div
                    className="timeline-header"
                    onClick={() => toggleCollapse(d.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleCollapse(d.id)}
                  >
                    <div className="timeline-header-main">
                      <span className="timeline-date">{format(new Date(d.date), 'M月d日 yyyy', { locale: zhCN })}</span>
                      <h4>{getDateSummary(d)}</h4>
                      {costMe > 0 && <span className="cost cost-me">我 ¥{formatCost(costMe)}</span>}
                      {costThem > 0 && <span className="cost cost-them">对方 ¥{formatCost(costThem)}</span>}
                    </div>
                    {isCollapsed ? (
                      <ChevronDown size={20} className="timeline-chevron" />
                    ) : (
                      <ChevronUp size={20} className="timeline-chevron" />
                    )}
                  </div>
                  {!isCollapsed && (
                    <div
                      className="timeline-body"
                      onClick={() => onEditDate(d.id)}
                    >
                      <ul className="timeline-items">
                        {d.items.map((it) => (
                          <li key={it.id}>
                            {it.time && <span className="item-time">{it.time}</span>}
                            {it.location && <span className="item-location">{it.location}</span>}
                            <span className="item-activity">{it.activity}</span>
                            {it.cost != null && it.cost > 0 && (
                              <span className={`cost cost-sm ${it.paidBy ? `cost-${it.paidBy}` : ''}`}>
                                ¥{formatCost(it.cost)}
                                {it.paidBy && ` (${PAID_BY_LABELS[it.paidBy]})`}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {(d.miscExpenses?.length ?? 0) > 0 && (
                        <div className="timeline-misc">
                          <span className="misc-label">零散消费：</span>
                          {d.miscExpenses!.map((m) => (
                            <span key={m.id} className={`cost cost-sm ${m.paidBy ? `cost-${m.paidBy}` : ''}`}>
                              {m.activity} ¥{formatCost(m.cost)}
                              {m.paidBy && ` (${PAID_BY_LABELS[m.paidBy]})`}
                            </span>
                          ))}
                        </div>
                      )}
                      {(d.tags ?? []).length > 0 && (
                        <div className="timeline-tags">
                          {(d.tags ?? []).map((t) => (
                            <span key={t} className="tag">{t}</span>
                          ))}
                        </div>
                      )}
                      {d.notes && <p className="timeline-notes">{d.notes}</p>}
                      {d.photos.length > 0 && (
                        <div className="timeline-photos">
                          {d.photos.slice(0, 5).map((src, i) => (
                            <button
                              key={i}
                              type="button"
                              className="timeline-photo-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPhotoViewer({ photos: d.photos, index: i })
                              }}
                            >
                              <img src={src} alt="" />
                            </button>
                          ))}
                          {d.photos.length > 5 && (
                            <button
                              type="button"
                              className="timeline-photo-more"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPhotoViewer({ photos: d.photos, index: 5 })
                              }}
                            >
                              +{d.photos.length - 5}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="timeline-delete btn btn-ghost icon-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmDeleteDate({ dateId: d.id })
                  }}
                  title="删除"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              )
            })}
          </div>
          </>
          )
        )}
      </section>

      {/* 重要节点 */}
      <MilestoneSection personId={person.id} milestones={milestones} onRefresh={onRefresh} />

      {/* 印象评价 */}
      <ImpressionSection personId={person.id} impression={impression} onRefresh={onRefresh} />

      {/* 待确认问题 */}
      <QuestionsSection personId={person.id} questions={questions} onRefresh={onRefresh} />

      {/* 下次约会计划 */}
      <PlanSection personId={person.id} plan={plan} onRefresh={onRefresh} />

      {/* 是否继续 */}
      <DecisionSection personId={person.id} decision={decision} onRefresh={onRefresh} />

      {/* 纪念日提醒建议 */}
      <AnniversarySuggestions personId={person.id} personName={person.name} onRefresh={onRefresh} />

      {/* 提醒 */}
      <ReminderSection personId={person.id} reminders={reminders} onRefresh={onRefresh} />

      {confirmDeletePerson && (
        <ConfirmModal
          title="删除人选"
          message={`确定要删除「${person.name}」吗？其所有约会记录、印象、提醒等数据将一并删除，此操作不可恢复。`}
          confirmText="删除"
          cancelText="取消"
          danger
          onConfirm={onDelete}
          onCancel={() => setConfirmDeletePerson(false)}
        />
      )}
      {confirmDeleteDate && (
        <ConfirmModal
          title="删除约会记录"
          message="确定删除这条约会记录吗？此操作不可恢复。"
          confirmText="删除"
          cancelText="取消"
          danger
          onConfirm={() => {
            db.dates.delete(confirmDeleteDate.dateId)
            onRefresh()
          }}
          onCancel={() => setConfirmDeleteDate(null)}
        />
      )}
      {(photoViewer || avatarViewerOpen) && (
        <PhotoViewer
          photos={photoViewer?.photos ?? person.photos}
          initialIndex={photoViewer?.index ?? 0}
          onClose={() => {
            setPhotoViewer(null)
            setAvatarViewerOpen(false)
          }}
        />
      )}
    </div>
  )
}

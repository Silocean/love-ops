import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { PersonInfo } from '../types'
import { db } from '../storage'
import { getDateSummary } from '../utils-date'

interface Props {
  persons: PersonInfo[]
  onSelectPerson: (p: PersonInfo) => void
  onSelectDateRecord?: (p: PersonInfo, dateId: string) => void
  onQuickAddDate?: (dateStr: string) => void
}

export default function CalendarView({ persons, onSelectPerson, onSelectDateRecord, onQuickAddDate }: Props) {
  const [current, setCurrent] = useState(new Date())
  const [filterPersonId, setFilterPersonId] = useState<string>('')

  const allDates = db.dates.getAll()
  const dates = filterPersonId
    ? allDates.filter((d) => d.personId === filterPersonId)
    : allDates
  const datesByDay: Record<string, { personId: string; dateId: string; activity: string; personName?: string }[]> = {}
  for (const d of dates) {
    const key = d.date
    if (!datesByDay[key]) datesByDay[key] = []
    const person = persons.find((p) => p.id === d.personId)
    datesByDay[key].push({
      personId: d.personId,
      dateId: d.id,
      activity: getDateSummary(d),
      personName: person?.name,
    })
  }

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad start (周一为第一天: Sun=6, Mon=0, Tue=1, ...)
  const startPad = (monthStart.getDay() + 6) % 7
  const padDays = Array(startPad).fill(null)

  return (
    <div className="page calendar-page">
      <div className="calendar-header">
        <button
          className="btn btn-ghost icon-btn calendar-nav"
          onClick={() => setCurrent(subMonths(current, 1))}
          aria-label="上月"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="calendar-title">{format(current, 'yyyy年M月', { locale: zhCN })}</h2>
        <button
          className="btn btn-ghost icon-btn calendar-nav"
          onClick={() => setCurrent(addMonths(current, 1))}
          aria-label="下月"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {persons.length > 0 && (
        <div className="calendar-filter">
          <label>对象筛选：</label>
          <select
            value={filterPersonId}
            onChange={(e) => setFilterPersonId(e.target.value)}
          >
            <option value="">全部</option>
            {persons.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="calendar-wrapper card">
        <div className="calendar-weekdays">
          {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
            <div key={d} className={`weekday ${i === 6 ? 'sunday' : ''}`}>{d}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {padDays.map((_, i) => (
            <div key={`pad-${i}`} className="calendar-day empty" />
          ))}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const items = datesByDay[key] ?? []
            const isCurrentMonth = isSameMonth(day, current)
            const today = isToday(day)
            const canQuickAdd = onQuickAddDate && isCurrentMonth && persons.length > 0
            return (
              <div
                key={key}
                className={`calendar-day ${items.length ? 'has-dates' : ''} ${!isCurrentMonth ? 'other-month' : ''} ${today ? 'today' : ''} ${canQuickAdd ? 'clickable' : ''}`}
                onClick={canQuickAdd ? (e) => {
                  const t = e.target as HTMLElement
                  if (t.closest('.day-event') || t.closest('.day-add-btn')) return
                  onQuickAddDate?.(key)
                } : undefined}
                role={canQuickAdd ? 'button' : undefined}
              >
                <span className="day-num">{format(day, 'd')}</span>
                <div className="day-events">
                  {items.slice(0, 2).map((ev) => {
                    const p = persons.find((x) => x.id === ev.personId)
                    return (
                      <div
                        key={ev.dateId}
                        className="day-event"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (p) {
                            if (onSelectDateRecord) {
                              onSelectDateRecord(p, ev.dateId)
                            } else {
                              onSelectPerson(p)
                            }
                          }
                        }}
                        title={`${ev.personName ?? '?'} - ${ev.activity}`}
                      >
                        <span className="day-event-dot" />
                        <span className="day-event-text">
                          {ev.personName ?? '?'}: {ev.activity}
                        </span>
                      </div>
                    )
                  })}
                  {items.length > 2 && (
                    <div className="day-event-more">+{items.length - 2}</div>
                  )}
                  {canQuickAdd && (
                    <button
                      type="button"
                      className="day-add-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        onQuickAddDate?.(key)
                      }}
                      title="添加约会"
                      aria-label="添加约会"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

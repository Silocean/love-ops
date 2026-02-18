import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { PersonInfo } from '../types'
import { db } from '../storage'
import { getDateSummary } from '../utils-date'

interface Props {
  persons: PersonInfo[]
  onSelectPerson: (p: PersonInfo) => void
}

export default function CalendarView({ persons, onSelectPerson }: Props) {
  const [current, setCurrent] = useState(new Date())

  const dates = db.dates.getAll()
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

  // Pad start
  const startPad = monthStart.getDay()
  const padDays = Array(startPad).fill(null)

  return (
    <div className="page calendar-page">
      <div className="page-header">
        <button className="btn btn-ghost icon-btn" onClick={() => setCurrent(subMonths(current, 1))}>←</button>
        <h2>{format(current, 'yyyy年M月', { locale: zhCN })}</h2>
        <button className="btn btn-ghost icon-btn" onClick={() => setCurrent(addMonths(current, 1))}>→</button>
      </div>

      <div className="calendar">
        <div className="calendar-weekdays">
          {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
            <div key={d} className="weekday">{d}</div>
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
            return (
              <div
                key={key}
                className={`calendar-day ${items.length ? 'has-dates' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
              >
                <span className="day-num">{format(day, 'd')}</span>
                {items.length > 0 && (
                  <div className="day-events">
                    {items.map((ev) => {
                      const p = persons.find((x) => x.id === ev.personId)
                      return (
                        <div
                          key={ev.dateId}
                          className="day-event"
                          onClick={() => p && onSelectPerson(p)}
                          title={`${ev.personName ?? '?'} - ${ev.activity}`}
                        >
                          {ev.personName ?? '?'}: {ev.activity}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { db } from '../storage'
import { id } from '../utils'
import { differenceInDays } from 'date-fns'

interface Props {
  personId: string
  personName: string
  onRefresh: () => void
}

export default function AnniversarySuggestions({ personId, personName, onRefresh }: Props) {
  const [added, setAdded] = useState<Set<string>>(new Set())
  const dates = db.dates.getByPerson(personId)
  const firstDate = dates.length > 0 ? dates[dates.length - 1]?.date : null
  const today = new Date().toISOString().slice(0, 10)

  if (dates.length === 0) return null

  const firstDateObj = firstDate ? new Date(firstDate) : null
  const daysSinceFirst = firstDateObj ? differenceInDays(new Date(), firstDateObj) : 0

  const suggestions: { key: string; title: string; date: string }[] = []
  if (daysSinceFirst >= 7) {
    const round = Math.floor(daysSinceFirst / 7) * 7
    if (round >= 7) suggestions.push({ key: `days-${round}`, title: `认识 ${round} 天`, date: today })
  }
  if (daysSinceFirst >= 30) {
    const round = Math.floor(daysSinceFirst / 30) * 30
    suggestions.push({ key: `days-${round}`, title: `认识 ${round} 天`, date: today })
  }
  const dateCount = dates.length
  if (dateCount >= 5) {
    const round = Math.floor(dateCount / 5) * 5
    suggestions.push({ key: `dates-${round}`, title: `约会 ${round} 次`, date: today })
  }

  const toAdd = suggestions.filter((s) => !added.has(s.key))
  if (toAdd.length === 0) return null

  const addReminder = (s: { key: string; title: string }) => {
    db.reminders.add({
      id: id(),
      personId,
      title: `${personName} - ${s.title}`,
      date: today,
      triggered: false,
      createdAt: new Date().toISOString(),
    })
    setAdded((prev) => new Set(prev).add(s.key))
    onRefresh()
  }

  return (
    <section className="detail-section card anniversary-suggestions">
      <h3>
        <Bell size={18} />
        纪念日提醒
      </h3>
      <p className="form-hint">可添加为提醒的重要节点</p>
      <div className="anniversary-list">
        {toAdd.map((s) => (
          <div key={s.key} className="anniversary-item">
            <span>{s.title}</span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => addReminder(s)}
            >
              添加提醒
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

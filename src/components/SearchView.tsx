import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { PersonInfo } from '../types'
import { db } from '../storage'

interface Props {
  persons: PersonInfo[]
  onSelectPerson: (p: PersonInfo) => void
}

export default function SearchView({ persons, onSelectPerson }: Props) {
  const [localQuery, setLocalQuery] = useState('')

  const results = useMemo(() => {
    const q = localQuery.trim().toLowerCase()
    if (!q) return []

    const matches: { person: PersonInfo; matchType: string; snippet?: string }[] = []

    for (const p of persons) {
      const fields = [
        p.name,
        p.job,
        p.hobbies,
        p.familyBg,
        p.matchmaker,
        p.education,
      ].filter(Boolean) as string[]

      for (const f of fields) {
        if (f.toLowerCase().includes(q)) {
          matches.push({ person: p, matchType: '个人资料', snippet: f })
          break
        }
      }

      const dates = db.dates.getByPerson(p.id)
      for (const d of dates) {
        const itemsText = d.items.map((it) => [it.location, it.activity].filter(Boolean).join(' ')).join(' ')
        const miscText = (d.miscExpenses ?? []).map((m) => m.activity).join(' ')
        const searchable = `${itemsText} ${miscText} ${d.notes}`.toLowerCase()
        if (searchable.includes(q)) {
          matches.push({
            person: p,
            matchType: '约会记录',
            snippet: `${itemsText} ${miscText} ${d.notes}`.trim().slice(0, 80),
          })
          break
        }
      }

      const imp = db.impressions.getByPerson(p.id)
      if (imp) {
        const allText = [
          ...imp.pros,
          ...imp.cons,
          ...imp.toObserve,
          imp.personality,
          imp.values,
          imp.habits,
        ].filter(Boolean).join(' ')
        if (allText.toLowerCase().includes(q)) {
          if (!matches.some((m) => m.person.id === p.id)) {
            matches.push({ person: p, matchType: '印象评价', snippet: allText.slice(0, 80) })
          }
        }
      }
    }

    return matches
  }, [persons, localQuery])

  const handleSearch = () => {}  // search is reactive via useMemo

  return (
    <div className="page search-page">
      <h2>搜索</h2>
      <div className="search-bar">
        <Search size={20} />
        <input
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="搜索姓名、地点、活动、印象..."
        />
        <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
      </div>

      {localQuery && (
        <div className="search-results">
          {results.length === 0 ? (
            <p className="empty-hint">未找到相关结果</p>
          ) : (
            <ul className="result-list">
              {results.map(({ person, matchType, snippet }) => (
                <li
                  key={person.id}
                  className="result-item card"
                  onClick={() => onSelectPerson(person)}
                >
                  <h4>{person.name}</h4>
                  <span className="match-type">{matchType}</span>
                  {snippet && <p className="snippet">{snippet}...</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import './App.css'
import {
  Heart,
  Users,
  Calendar,
  BarChart3,
  Star,
  CheckSquare,
  CalendarClock,
  Search,
  Download,
  ChevronRight,
} from 'lucide-react'
import type { PersonInfo } from './types'
import { db } from './storage'
import { STAGE_LABELS } from './constants'
import PersonList from './components/PersonList'
import PersonDetail from './components/PersonDetail'
import PersonForm from './components/PersonForm'
import DateForm from './components/DateForm'
import CalendarView from './components/CalendarView'
import StatsView from './components/StatsView'
import SearchView from './components/SearchView'
import ExportView from './components/ExportView'
import ReminderCheck from './components/ReminderCheck'

type Page = 'list' | 'detail' | 'person-form' | 'date-form' | 'calendar' | 'stats' | 'search' | 'export'

function App() {
  const [page, setPage] = useState<Page>('list')
  const [persons, setPersons] = useState<PersonInfo[]>([])
  const [selectedPerson, setSelectedPerson] = useState<PersonInfo | null>(null)
  const [editingDateId, setEditingDateId] = useState<string | null>(null)

  const refresh = () => setPersons(db.persons.getAll())

  useEffect(() => {
    refresh()
  }, [])

  const nav = [
    { id: 'list' as const, icon: Users, label: '人选' },
    { id: 'calendar' as const, icon: Calendar, label: '日历' },
    { id: 'stats' as const, icon: BarChart3, label: '统计' },
    { id: 'search' as const, icon: Search, label: '搜索' },
    { id: 'export' as const, icon: Download, label: '导出' },
  ]

  return (
    <div className="app">
      <ReminderCheck persons={persons} />
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">
            <Heart size={24} />
            对象分析系统
          </h1>
          <nav className="main-nav">
            {nav.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={`nav-btn ${page === id ? 'active' : ''}`}
                onClick={() => setPage(id)}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {page === 'list' && (
          <PersonList
            persons={persons}
            onSelect={(p) => {
              setSelectedPerson(p)
              setPage('detail')
            }}
            onAdd={() => {
              setSelectedPerson(null)
              setPage('person-form')
            }}
            onEdit={(p) => {
              setSelectedPerson(p)
              setPage('person-form')
            }}
          />
        )}

        {page === 'detail' && selectedPerson && (
          <PersonDetail
            person={selectedPerson}
            onBack={() => setPage('list')}
            onEdit={() => setPage('person-form')}
            onAddDate={() => {
              setEditingDateId(null)
              setPage('date-form')
            }}
            onEditDate={(id) => {
              setEditingDateId(id)
              setPage('date-form')
            }}
            onRefresh={refresh}
          />
        )}

        {page === 'person-form' && (
          <PersonForm
            person={selectedPerson}
            onSave={() => {
              refresh()
              const saved = db.persons.getAll()
              setSelectedPerson(saved[saved.length - 1] ?? null)
              setPage(selectedPerson ? 'detail' : 'list')
            }}
            onCancel={() => setPage(selectedPerson ? 'detail' : 'list')}
          />
        )}

        {page === 'date-form' && selectedPerson && (
          <DateForm
            person={selectedPerson}
            editDateId={editingDateId}
            onSave={() => {
              setEditingDateId(null)
              setPage('detail')
            }}
            onCancel={() => {
              setEditingDateId(null)
              setPage('detail')
            }}
          />
        )}

        {page === 'calendar' && (
          <CalendarView
            persons={persons}
            onSelectPerson={(p) => {
              setSelectedPerson(p)
              setPage('detail')
            }}
          />
        )}

        {page === 'stats' && <StatsView persons={persons} />}

        {page === 'search' && (
          <SearchView
            persons={persons}
            onSelectPerson={(p) => {
              setSelectedPerson(p)
              setPage('detail')
            }}
          />
        )}

        {page === 'export' && (
          <ExportView persons={persons} />
        )}
      </main>
    </div>
  )
}

export default App

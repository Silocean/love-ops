import { useState, useEffect, useRef } from 'react'
import './App.css'
import {
  Heart,
  Users,
  Calendar,
  BarChart3,
  Search,
  Download,
  Moon,
  Sun,
  Cloud,
  CloudOff,
  LogOut,
} from 'lucide-react'
import type { PersonInfo } from './types'
import { db } from './storage'
import PersonList from './components/PersonList'
import PersonDetail from './components/PersonDetail'
import PersonForm from './components/PersonForm'
import DateForm from './components/DateForm'
import CalendarView from './components/CalendarView'
import StatsView from './components/StatsView'
import SearchView from './components/SearchView'
import ExportView from './components/ExportView'
import ReminderCheck from './components/ReminderCheck'
import PersonPickerModal from './components/PersonPickerModal'
import OnboardingGuide from './components/OnboardingGuide'
import AuthModal from './components/AuthModal'
import { useTheme } from './context/ThemeContext'
import { useAuth } from './context/AuthContext'
import { useSync } from './sync/useSync'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

type Page = 'list' | 'detail' | 'calendar' | 'stats' | 'search' | 'export' | 'person-form' | 'date-form'

function App() {
  const { theme, setTheme } = useTheme()
  const { user, loading: authLoading, signOut, isConfigured } = useAuth()
  const refresh = () => setPersons(db.persons.getAll())
  const sync = useSync(refresh)
  const initialPullDone = useRef(false)

  const [page, setPage] = useState<Page>('list')
  const [persons, setPersons] = useState<PersonInfo[]>([])
  const [selectedPerson, setSelectedPerson] = useState<PersonInfo | null>(null)
  const [editingDateId, setEditingDateId] = useState<string | null>(null)
  const [presetDate, setPresetDate] = useState<string | null>(null)
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null)
  const [scrollToDateId, setScrollToDateId] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (!authLoading && user && sync.isConfigured && !initialPullDone.current) {
      initialPullDone.current = true
      sync.pullNow()
    }
  }, [authLoading, user, sync.isConfigured, sync.pullNow])

  useEffect(() => {
    if (page === 'date-form') {
      window.scrollTo(0, 0)
    }
  }, [page])

  const nav = [
    { id: 'list' as const, icon: Users, label: '人选' },
    { id: 'calendar' as const, icon: Calendar, label: '日历' },
    { id: 'stats' as const, icon: BarChart3, label: '统计' },
    { id: 'search' as const, icon: Search, label: '搜索' },
    { id: 'export' as const, icon: Download, label: '导出' },
  ]

  return (
    <div className="app">
      <OnboardingGuide personsCount={persons.length} onClose={() => {}} />
      <ReminderCheck persons={persons} />
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">
            <Heart size={24} />
            对象分析系统
          </h1>
          <div className="header-actions-row">
            {isConfigured && (
              <>
                {user ? (
                  <div className="sync-status">
                    <button
                      type="button"
                      className="btn btn-ghost icon-btn"
                      onClick={() => sync.syncNow()}
                      disabled={sync.syncing}
                      title="立即同步"
                      aria-label="同步"
                    >
                      {sync.syncing ? (
                        <Cloud size={20} className="sync-spin" />
                      ) : (
                        <Cloud size={20} />
                      )}
                    </button>
                    {sync.lastSyncedAt && (
                      <span className="sync-time">
                        {format(new Date(sync.lastSyncedAt), 'M月d日 HH:mm', { locale: zhCN })}
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost icon-btn"
                      onClick={() => signOut()}
                      title="登出"
                      aria-label="登出"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    <CloudOff size={18} />
                    登录
                  </button>
                )}
              </>
            )}
            <button
              className="btn btn-ghost icon-btn theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? '切换亮色' : '切换暗色'}
              aria-label="切换主题"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
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
            highlightDateId={scrollToDateId}
            onHighlightDone={() => setScrollToDateId(null)}
            onBack={() => setPage('list')}
            onEdit={() => setPage('person-form')}
            onDelete={() => {
              db.persons.deleteWithData(selectedPerson.id)
              setSelectedPerson(null)
              refresh()
              setPage('list')
            }}
            onAddDate={() => {
              setEditingDateId(null)
              setPresetDate(null)
              setPage('date-form')
            }}
            onEditDate={(id) => {
              setEditingDateId(id)
              setPresetDate(null)
              setPage('date-form')
            }}
            onRefresh={refresh}
          />
        )}

        {page === 'calendar' && (
          <CalendarView
            persons={persons}
            onSelectPerson={(p) => {
              setSelectedPerson(p)
              setScrollToDateId(null)
              setPage('detail')
            }}
            onSelectDateRecord={(p, dateId) => {
              setSelectedPerson(p)
              setScrollToDateId(dateId)
              setPage('detail')
            }}
            onQuickAddDate={(dateStr) => {
              setQuickAddDate(dateStr)
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
          <ExportView persons={persons} onRefresh={refresh} />
        )}

        {page === 'person-form' && (
          <PersonForm
            person={selectedPerson}
            onSave={() => {
              refresh()
              const editingId = selectedPerson?.id
              const saved = db.persons.getAll()
              if (editingId) {
                setSelectedPerson(saved.find((p) => p.id === editingId) ?? saved[saved.length - 1] ?? null)
                setPage('detail')
              } else {
                setSelectedPerson(saved[saved.length - 1] ?? null)
                setPage(saved.length > 0 ? 'detail' : 'list')
              }
            }}
            onCancel={() => {
              if (selectedPerson) setPage('detail')
              else setPage('list')
            }}
          />
        )}

        {page === 'date-form' && selectedPerson && (
          <DateForm
            person={selectedPerson}
            editDateId={editingDateId}
            presetDate={presetDate ?? undefined}
            onSave={() => {
              setEditingDateId(null)
              setPresetDate(null)
              setPage('detail')
            }}
            onCancel={() => {
              setEditingDateId(null)
              setPresetDate(null)
              setPage('detail')
            }}
          />
        )}
      </main>

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}

      {quickAddDate && persons.length > 0 && (
        <PersonPickerModal
          persons={persons}
          dateStr={quickAddDate}
          onSelect={(p) => {
            setSelectedPerson(p)
            setPresetDate(quickAddDate)
            setEditingDateId(null)
            setQuickAddDate(null)
            setPage('date-form')
          }}
          onClose={() => setQuickAddDate(null)}
        />
      )}

    </div>
  )
}

export default App

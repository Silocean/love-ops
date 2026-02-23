import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import {
  Heart,
  Users,
  Calendar,
  BarChart3,
  Download,
  Moon,
  Sun,
  Cloud,
  CloudOff,
  ChevronDown,
  Settings,
} from 'lucide-react'
import ConfirmModal from './components/ConfirmModal'
import type { PersonInfo } from './types'
import { db } from './storage'
import PersonList from './components/PersonList'
import PersonDetail from './components/PersonDetail'
import PersonForm from './components/PersonForm'
import DateForm from './components/DateForm'
import CalendarView from './components/CalendarView'
import StatsView from './components/StatsView'
import ExportView from './components/ExportView'
import ReminderCheck from './components/ReminderCheck'
import PersonPickerModal from './components/PersonPickerModal'
import OnboardingGuide from './components/OnboardingGuide'
import AuthModal from './components/AuthModal'
import SettingsView from './components/SettingsView'
import BottomTabBar, { type TabId } from './components/BottomTabBar'
import { useTheme } from './context/ThemeContext'
import { useAuth } from './context/AuthContext'
import { useSync } from './sync/useSync'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

type Page = 'list' | 'detail' | 'calendar' | 'stats' | 'export' | 'person-form' | 'date-form' | 'settings'

function App() {
  const { theme, setTheme } = useTheme()
  const { user, loading: authLoading, signOut, isConfigured } = useAuth()
  const refresh = useCallback(() => setPersons(db.persons.getAll()), [])
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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    if (!moreMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [moreMenuOpen])

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (!user) initialPullDone.current = false
  }, [user])

  useEffect(() => {
    if (!authLoading && user && sync.isConfigured && !initialPullDone.current) {
      initialPullDone.current = true
      const doPull = (retry = false) => {
        sync.pullNow().then((ok) => {
          if (!ok && !retry) {
            setTimeout(() => sync.pullNow(), 800)
          }
        })
      }
      doPull()
    }
  }, [authLoading, user, sync.isConfigured, sync.pullNow])

  useEffect(() => {
    if (!user || !sync.isConfigured) return
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sync.pullNow({ skipSyncing: true }).then((ok) => {
          if (ok) refresh()
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [user, sync.isConfigured, sync.pullNow, refresh])

  useEffect(() => {
    if (page === 'date-form') {
      window.scrollTo(0, 0)
    }
  }, [page])

  const nav = [
    { id: 'list' as const, icon: Users, label: '人选' },
    { id: 'calendar' as const, icon: Calendar, label: '日历' },
    { id: 'stats' as const, icon: BarChart3, label: '统计' },
  ]

  const mobileTabNav: { id: TabId; icon: typeof Users; label: string }[] = [
    { id: 'list', icon: Users, label: '人选' },
    { id: 'stats', icon: BarChart3, label: '统计' },
    { id: 'calendar', icon: Calendar, label: '日历' },
    { id: 'settings', icon: Settings, label: '设置' },
  ]

  const getActiveTabId = (): TabId => {
    if (['list', 'detail', 'person-form', 'date-form'].includes(page)) return 'list'
    if (page === 'stats') return 'stats'
    if (page === 'calendar') return 'calendar'
    if (['settings', 'export'].includes(page)) return 'settings'
    return 'list'
  }

  return (
    <div className="app">
      <OnboardingGuide personsCount={persons.length} onClose={() => {}} />
      <ReminderCheck persons={persons} />
      {!isOnline && (
        <div className="offline-banner">
          离线模式 · 数据已保存到本地
        </div>
      )}
      {user && sync.error && (
        <div className="sync-error-banner">
          同步失败：{sync.error}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => sync.syncNow()}>
            重试
          </button>
        </div>
      )}
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">
            <Heart size={24} />
            对象分析系统
          </h1>
          <div className="header-actions-row">
            {isConfigured && (
              <>
                {authLoading ? (
                  <span className="header-auth-loading" aria-label="正在恢复登录">
                    <Cloud size={18} className="sync-spin" />
                    登录中…
                  </span>
                ) : user ? (
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
            <div className="header-nav-web">
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
              <div className="header-more-wrapper" ref={moreMenuRef}>
              <button
                type="button"
                className={`header-more-trigger nav-btn ${moreMenuOpen ? 'active' : ''}`}
                onClick={() => setMoreMenuOpen((v) => !v)}
                aria-expanded={moreMenuOpen}
                aria-haspopup="true"
              >
                <ChevronDown size={18} />
                更多
              </button>
              {moreMenuOpen && (
                <div className="header-more-dropdown">
                  <button
                    type="button"
                    className="header-more-item"
                    onClick={() => {
                      setPage('export')
                      setMoreMenuOpen(false)
                    }}
                  >
                    <Download size={16} />
                    导出
                  </button>
                  {isConfigured && user && (
                    <button
                      type="button"
                      className="header-more-item"
                      onClick={() => {
                        setConfirmLogout(true)
                        setMoreMenuOpen(false)
                      }}
                    >
                      退出登录
                    </button>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="main-inner">
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

        {page === 'settings' && (
          <SettingsView
            sync={{
              syncing: sync.syncing,
              lastSyncedAt: sync.lastSyncedAt,
              error: sync.error,
              syncNow: sync.syncNow,
            }}
            onNavigateToExport={() => setPage('export')}
            onLoginClick={() => setAuthModalOpen(true)}
            onLogoutClick={() => setConfirmLogout(true)}
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
        <div className="bottom-tab-spacer" aria-hidden />
        </div>
      </main>

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
      {confirmLogout && (
        <ConfirmModal
          title="退出登录"
          message="确定要退出登录吗？"
          confirmText="退出"
          danger
          onConfirm={() => {
            signOut()
            setConfirmLogout(false)
          }}
          onCancel={() => setConfirmLogout(false)}
        />
      )}

      <BottomTabBar
        tabs={mobileTabNav}
        activeId={getActiveTabId()}
        onChange={(id) => {
          if (id === 'settings') setPage('settings')
          else if (id === 'list') setPage('list')
          else if (id === 'stats') setPage('stats')
          else if (id === 'calendar') setPage('calendar')
        }}
      />

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

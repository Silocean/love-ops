import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { exportBackup, importBackup, setAfterSaveHook } from '../storage'
import { push, pull } from './supabase-sync'

const SYNC_DEBOUNCE_MS = 1500
const LAST_SYNC_KEY = 'love-ops-last-synced'

export function useSync(onDataPulled?: () => void) {
  const { user, isConfigured } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    localStorage.getItem(LAST_SYNC_KEY)
  )
  const pushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const schedulePush = useCallback(() => {
    if (!user || !isConfigured) return
    if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current)
    pushTimeoutRef.current = setTimeout(async () => {
      pushTimeoutRef.current = null
      setSyncing(true)
      setError(null)
      const data = exportBackup()
      const { error: err } = await push(data)
      if (err) {
        setError(err.message)
      } else {
        const ts = new Date().toISOString()
        localStorage.setItem(LAST_SYNC_KEY, ts)
        setLastSyncedAt(ts)
      }
      setSyncing(false)
    }, SYNC_DEBOUNCE_MS)
  }, [user, isConfigured])

  const syncNow = useCallback(async () => {
    if (!user || !isConfigured) return
    setSyncing(true)
    setError(null)
    const data = exportBackup()
    const { error: pushErr } = await push(data)
    if (pushErr) {
      setError(pushErr.message)
    } else {
      const ts = new Date().toISOString()
      localStorage.setItem(LAST_SYNC_KEY, ts)
      setLastSyncedAt(ts)
    }
    setSyncing(false)
  }, [user, isConfigured])

  const pullNow = useCallback(async (): Promise<boolean> => {
    if (!user || !isConfigured) return false
    setSyncing(true)
    setError(null)
    const { data, error: pullErr } = await pull()
    setSyncing(false)
    if (pullErr) {
      setError(pullErr.message)
      return false
    }
    if (data) {
      const result = importBackup(data)
      if (result.ok) {
        const ts = new Date().toISOString()
        localStorage.setItem(LAST_SYNC_KEY, ts)
        setLastSyncedAt(ts)
        onDataPulled?.()
        return true
      }
    }
    return false
  }, [user, isConfigured, onDataPulled])

  useEffect(() => {
    if (user && isConfigured) {
      setAfterSaveHook(schedulePush)
    }
    return () => {
      setAfterSaveHook(null)
      if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current)
    }
  }, [user, isConfigured, schedulePush])

  return {
    schedulePush,
    syncNow,
    pullNow,
    syncing,
    error,
    lastSyncedAt,
    isConfigured,
    isLoggedIn: !!user,
  }
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithMagicLink = async (email: string) => {
    if (!supabase) return { error: new Error('云同步未配置') }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return { error: error ?? null }
  }

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('云同步未配置') }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ?? null }
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('云同步未配置') }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error ?? null }
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
  }

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signInWithMagicLink,
    signInWithPassword,
    signUp,
    signOut,
    isConfigured: Boolean(supabase),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

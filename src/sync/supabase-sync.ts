import type { BackupData } from '../storage'
import { supabase } from '../lib/supabase'

const SCHEMA_NAME = 'love_ops'
const TABLE_NAME = 'user_data'

export async function push(data: BackupData): Promise<{ error: Error | null }> {
  if (!supabase) return { error: new Error('云同步未配置') }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('未登录') }

  const { error } = await supabase
    .schema(SCHEMA_NAME)
    .from(TABLE_NAME)
    .upsert(
      {
        user_id: user.id,
        data: data as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  return { error: error ?? null }
}

export async function pull(): Promise<{ data: BackupData | null; error: Error | null }> {
  if (!supabase) return { data: null, error: new Error('云同步未配置') }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('未登录') }

  const { data: row, error } = await supabase
    .schema(SCHEMA_NAME)
    .from(TABLE_NAME)
    .select('data')
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: null, error: null }
    }
    return { data: null, error }
  }

  const data = row?.data as BackupData | null
  if (!data || !data.version || !Array.isArray(data.persons)) {
    return { data: null, error: null }
  }

  return { data, error: null }
}

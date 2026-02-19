import { id } from '../utils'
import { supabase } from '../lib/supabase'

const BUCKET_NAME = 'love_ops_photos'

const mimeToExt: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

function getExt(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^(jpg|jpeg|png|gif|webp)$/.test(fromName)) return fromName
  return mimeToExt[file.type] ?? 'jpg'
}

export async function uploadPhoto(
  file: File,
  userId: string
): Promise<{ url: string; error: Error | null }> {
  if (!file) return { url: '', error: new Error('未选择文件') }
  if (!supabase) return { url: '', error: new Error('云同步未配置') }
  const ext = getExt(file)
  const path = `${userId}/${id()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, { contentType: file.type })

  if (error) return { url: '', error }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

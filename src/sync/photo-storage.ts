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

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, { contentType: file.type })

    if (error) return { url: '', error }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  } catch (err) {
    return { url: '', error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** 上传照片，失败时回退到 base64 本地存储（离线场景） */
export async function uploadPhotoWithOfflineFallback(
  file: File,
  userId: string
): Promise<{ url: string; error: Error | null }> {
  const result = await uploadPhoto(file, userId)
  if (!result.error) return result
  const msg = result.error.message.toLowerCase()
  const isOffline = !navigator.onLine || msg.includes('fetch') || msg.includes('network') || msg.includes('failed') || msg.includes('load')
  if (isOffline) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    return { url: base64, error: null }
  }
  return result
}

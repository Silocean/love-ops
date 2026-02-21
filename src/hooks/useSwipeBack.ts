import { useEffect, useRef, useCallback } from 'react'

const EDGE_ZONE = 25
const MIN_SWIPE = 60
const MAX_VERTICAL = 80

/**
 * 移动端从左侧边缘右滑返回
 * @param onBack 返回回调
 * @param enabled 是否启用（如仅在移动端启用）
 */
export function useSwipeBack(onBack: () => void, enabled = true) {
  const startRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || window.innerWidth > 640) return
      const touch = e.touches[0]
      if (touch.clientX <= EDGE_ZONE) {
        startRef.current = { x: touch.clientX, y: touch.clientY }
      }
    },
    [enabled]
  )

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!startRef.current) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - startRef.current.x
      const dy = Math.abs(touch.clientY - startRef.current.y)
      startRef.current = null
      if (dx >= MIN_SWIPE && dy <= MAX_VERTICAL) {
        onBack()
      }
    },
    [onBack]
  )

  const handleTouchCancel = useCallback(() => {
    startRef.current = null
  }, [])

  useEffect(() => {
    if (!enabled) return
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true })
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [enabled, handleTouchStart, handleTouchEnd, handleTouchCancel])
}

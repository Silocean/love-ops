import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Props {
  photos: string[]
  initialIndex: number
  onClose: () => void
}

export default function PhotoViewer({ photos, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const current = photos[index]

  const prev = () => setIndex((i) => (i <= 0 ? photos.length - 1 : i - 1))
  const next = () => setIndex((i) => (i >= photos.length - 1 ? 0 : i + 1))

  return (
    <div
      className="photo-viewer-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
        if (e.key === 'ArrowRight') { e.preventDefault(); next() }
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <button
        className="photo-viewer-close"
        onClick={onClose}
        aria-label="关闭"
      >
        <X size={28} />
      </button>
      {photos.length > 1 && (
        <>
          <button
            className="photo-viewer-nav photo-viewer-prev"
            onClick={(e) => { e.stopPropagation(); prev() }}
            aria-label="上一张"
          >
            <ChevronLeft size={40} />
          </button>
          <button
            className="photo-viewer-nav photo-viewer-next"
            onClick={(e) => { e.stopPropagation(); next() }}
            aria-label="下一张"
          >
            <ChevronRight size={40} />
          </button>
        </>
      )}
      <div className="photo-viewer-content" onClick={(e) => e.stopPropagation()}>
        <img src={current} alt="" />
      </div>
      {photos.length > 1 && (
        <div className="photo-viewer-counter">
          {index + 1} / {photos.length}
        </div>
      )}
    </div>
  )
}

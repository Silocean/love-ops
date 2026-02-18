import { X } from 'lucide-react'
import type { PersonInfo } from '../types'

interface Props {
  persons: PersonInfo[]
  dateStr: string
  onSelect: (p: PersonInfo) => void
  onClose: () => void
}

export default function PersonPickerModal({ persons, dateStr, onSelect, onClose }: Props) {
  if (persons.length === 0) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>为谁添加 {dateStr} 的约会？</h3>
          <button className="btn btn-ghost icon-btn" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        <ul className="person-picker-list">
          {persons.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="person-picker-btn"
                onClick={() => onSelect(p)}
              >
                <span className="person-picker-avatar">
                  {p.photos[0] ? (
                    <img src={p.photos[0]} alt={p.name} />
                  ) : (
                    <span className="avatar-placeholder">{p.name[0]}</span>
                  )}
                </span>
                <span className="person-picker-name">{p.name}</span>
                {p.job && <span className="person-picker-meta">{p.job}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

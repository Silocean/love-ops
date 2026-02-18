import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  placeholder?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export default function InputModal({ title, placeholder = '', onConfirm, onCancel }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue('')
    inputRef.current?.focus()
  }, [title])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed) {
      onConfirm(trimmed)
      onCancel()
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content card input-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="btn btn-ghost icon-btn" onClick={onCancel} aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        <div className="input-modal-body">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={placeholder}
            className="input-modal-input"
          />
        </div>
        <div className="input-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>取消</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>确定</button>
        </div>
      </div>
    </div>
  )
}

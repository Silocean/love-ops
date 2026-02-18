import { useState, useRef } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import type { PersonInfo, DateRecordItem, DateMiscExpense, PaidBy } from '../types'
import { PAID_BY_LABELS } from '../constants'
import { db } from '../storage'
import { id, now, today } from '../utils'

interface Props {
  person: PersonInfo
  editDateId: string | null
  presetDate?: string  // 预设日期，如从日历点击传入
  onSave: () => void
  onCancel: () => void
}

const emptyItem = (): DateRecordItem => ({
  id: id(),
  activity: '',
  paidBy: 'me',
})

const emptyMisc = (): DateMiscExpense => ({
  id: id(),
  activity: '',
  cost: 0,
  paidBy: 'me',
})

export default function DateForm({ person, editDateId, presetDate, onSave, onCancel }: Props) {
  const existing = editDateId ? db.dates.getAll().find((d) => d.id === editDateId) : null

  const [date, setDate] = useState(existing?.date ?? presetDate ?? today())
  const [items, setItems] = useState<DateRecordItem[]>(
    existing?.items?.length ? [...existing.items] : [emptyItem()]
  )
  const [miscExpenses, setMiscExpenses] = useState<DateMiscExpense[]>(
    existing?.miscExpenses ?? []
  )
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? [])
  const [tags, setTags] = useState<string[]>(existing?.tags ?? [])
  const fileRef = useRef<HTMLInputElement>(null)

  const updateItem = (idx: number, updater: (it: DateRecordItem) => DateRecordItem) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? updater(it) : it)))
  }

  const addItem = () => setItems((prev) => [...prev, emptyItem()])

  const removeItem = (idx: number) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateMisc = (idx: number, updater: (m: DateMiscExpense) => DateMiscExpense) => {
    setMiscExpenses((prev) => prev.map((m, i) => (i === idx ? updater(m) : m)))
  }
  const addMisc = () => setMiscExpenses((prev) => [...prev, emptyMisc()])
  const removeMisc = (idx: number) => setMiscExpenses((prev) => prev.filter((_, i) => i !== idx))

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const reader = new FileReader()
    reader.onload = () => setPhotos((prev) => [...prev, reader.result as string])
    reader.readAsDataURL(files[0])
  }

  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))

  const [tagInput, setTagInput] = useState('')
  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }
  const removeTag = (i: number) => setTags((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validItems = items.filter((it) => it.activity.trim())
    if (validItems.length === 0) {
      alert('请至少添加一条行程（活动内容必填）')
      return
    }
    const ts = now()
    const validMisc = miscExpenses.filter((m) => m.activity.trim() && (m.cost ?? 0) > 0)
    const payload = {
      date,
      items: validItems,
      miscExpenses: validMisc,
      notes,
      photos,
      tags,
      updatedAt: ts,
    }
    if (existing) {
      db.dates.update(existing.id, (d) => ({ ...d, ...payload }))
    } else {
      db.dates.add({
        id: id(),
        personId: person.id,
        ...payload,
        createdAt: ts,
      })
    }
    onSave()
  }

  return (
    <div className="page form-page">
      <div className="page-header">
        <button className="btn btn-ghost icon-btn" onClick={onCancel}>
          <ArrowLeft size={20} />
        </button>
        <h2>{existing ? '编辑约会' : '添加约会'} - {person.name}</h2>
      </div>
      <form className="date-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>日期 *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>行程明细</h3>
            <button type="button" className="btn btn-primary btn-sm" onClick={addItem}>
              <Plus size={16} /> 添加行程
            </button>
          </div>
          {items.map((it, idx) => (
            <div key={it.id} className="date-item-card">
              <div className="date-item-header">
                <span className="item-index">第 {idx + 1} 站</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost icon-btn btn-sm"
                    onClick={() => removeItem(idx)}
                    title="删除此行程"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="date-item-fields">
                <div className="form-row two-cols">
                  <div>
                    <label>时间</label>
                    <input
                      type="time"
                      value={it.time ?? ''}
                      onChange={(e) => updateItem(idx, (x) => ({ ...x, time: e.target.value || undefined }))}
                    />
                  </div>
                  <div>
                    <label>地点</label>
                    <input
                      value={it.location ?? ''}
                      onChange={(e) => updateItem(idx, (x) => ({ ...x, location: e.target.value || undefined }))}
                      placeholder="可选"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label>活动 *</label>
                  <input
                    value={it.activity}
                    onChange={(e) => updateItem(idx, (x) => ({ ...x, activity: e.target.value }))}
                    placeholder="如：午饭、打车、晚饭"
                  />
                </div>
                <div className="form-row two-cols">
                  <div>
                    <label>花费(元)</label>
                    <input
                      type="number"
                      value={it.cost?.toString() ?? ''}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) =>
                        updateItem(idx, (x) => ({
                          ...x,
                          cost: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      placeholder="0"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <label>谁出钱</label>
                    <select
                      value={it.paidBy ?? 'me'}
                      onChange={(e) => updateItem(idx, (x) => ({ ...x, paidBy: e.target.value as PaidBy }))}
                    >
                      {(Object.entries(PAID_BY_LABELS) as [PaidBy, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>零散消费</h3>
            <button type="button" className="btn btn-primary btn-sm" onClick={addMisc}>
              <Plus size={16} /> 添加
            </button>
          </div>
          <p className="form-hint">奶茶、零食等不便归属到行程的小额消费</p>
          {miscExpenses.length === 0 ? (
            <p className="empty-hint small">暂无，点击上方添加</p>
          ) : (
            miscExpenses.map((m, idx) => (
              <div key={m.id} className="misc-expense-row">
                <input
                  value={m.activity}
                  onChange={(e) => updateMisc(idx, (x) => ({ ...x, activity: e.target.value }))}
                  placeholder="如：奶茶、零食"
                  className="misc-activity"
                />
                <input
                  type="number"
                  value={m.cost ? m.cost.toString() : ''}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) =>
                    updateMisc(idx, (x) => ({ ...x, cost: e.target.value ? parseFloat(e.target.value) : 0 }))
                  }
                  placeholder="金额"
                  min={0}
                  step={0.01}
                  className="misc-cost"
                />
                <select
                  value={m.paidBy}
                  onChange={(e) => updateMisc(idx, (x) => ({ ...x, paidBy: e.target.value as PaidBy }))}
                  className="misc-paidby"
                >
                  {(Object.entries(PAID_BY_LABELS) as [PaidBy, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-ghost icon-btn btn-sm"
                  onClick={() => removeMisc(idx)}
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="form-row">
          <label>标签（可选）</label>
          <div className="inline-form">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="如：吃饭、看电影"
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={addTag}>添加</button>
          </div>
          {tags.length > 0 && (
            <div className="tags tag-input-list" style={{ marginTop: '0.5rem' }}>
              {tags.map((t, i) => (
                <span key={`${t}-${i}`} className="tag">
                  {t}
                  <button type="button" className="tag-remove" onClick={() => removeTag(i)} aria-label="删除">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="form-row">
          <label>整体感想/备注</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="记录这次约会的感受..." rows={4} />
        </div>
        <div className="form-row">
          <label>照片</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            style={{ display: 'none' }}
          />
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            添加照片
          </button>
          <div className="photo-grid">
            {photos.map((src, i) => (
              <div key={i} className="photo-preview">
                <img src={src} alt="" />
                <button type="button" className="remove-photo" onClick={() => removePhoto(i)}>×</button>
              </div>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>取消</button>
          <button type="submit" className="btn btn-primary">保存</button>
        </div>
      </form>
    </div>
  )
}

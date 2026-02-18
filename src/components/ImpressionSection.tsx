import { useState } from 'react'
import { Star } from 'lucide-react'
import type { Impression } from '../types'
import { db } from '../storage'
import { id, now } from '../utils'
import InputModal from './InputModal'

interface Props {
  personId: string
  impression: Impression | undefined
  onRefresh: () => void
}

export default function ImpressionSection({ personId, impression, onRefresh }: Props) {
  const [editing, setEditing] = useState(false)
  const [pros, setPros] = useState(impression?.pros ?? [])
  const [cons, setCons] = useState(impression?.cons ?? [])
  const [toObserve, setToObserve] = useState(impression?.toObserve ?? [])
  const [tags, setTags] = useState(impression?.tags.join(', ') ?? '')
  const [personality, setPersonality] = useState(impression?.personality ?? '')
  const [values, setValues] = useState(impression?.values ?? '')
  const [habits, setHabits] = useState(impression?.habits ?? '')
  const [addModal, setAddModal] = useState<{ label: string; setter: (a: string[]) => void; arr: string[] } | null>(null)

  const addItem = (arr: string[], setter: (a: string[]) => void, label: string) => {
    setAddModal({ label, setter, arr })
  }

  const removeItem = (arr: string[], setter: (a: string[]) => void, i: number) => {
    setter(arr.filter((_, idx) => idx !== i))
  }

  const save = () => {
    db.impressions.upsert({
      id: impression?.id ?? id(),
      personId,
      pros,
      cons,
      toObserve,
      tags: tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      personality: personality || undefined,
      values: values || undefined,
      habits: habits || undefined,
      updatedAt: now(),
    })
    setEditing(false)
    onRefresh()
  }

  const cancel = () => {
    setPros(impression?.pros ?? [])
    setCons(impression?.cons ?? [])
    setToObserve(impression?.toObserve ?? [])
    setTags(impression?.tags.join(', ') ?? '')
    setPersonality(impression?.personality ?? '')
    setValues(impression?.values ?? '')
    setHabits(impression?.habits ?? '')
    setEditing(false)
  }

  return (
    <section className="detail-section card">
      <div className="section-header">
        <h3><Star size={18} /> 印象与评价</h3>
        {!editing ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>编辑</button>
        ) : (
          <div>
            <button className="btn btn-ghost btn-sm" onClick={cancel}>取消</button>
            <button className="btn btn-primary btn-sm" onClick={save}>保存</button>
          </div>
        )}
      </div>

      {!impression && !editing ? (
        <p className="empty-hint">暂无印象记录，点击编辑添加</p>
      ) : (
        <div className="impression-form">
          <div className="list-field">
            <label>优点</label>
            {editing ? (
              <>
                <ul>
                  {pros.map((x, i) => (
                    <li key={i}>
                      {x}
                      <button type="button" className="remove-item" onClick={() => removeItem(pros, setPros, i)}>×</button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => addItem(pros, setPros, '优点')}>+ 添加</button>
              </>
            ) : (
              <ul>{pros.map((x, i) => <li key={i}>{x}</li>)}</ul>
            )}
          </div>
          <div className="list-field">
            <label>缺点</label>
            {editing ? (
              <>
                <ul>
                  {cons.map((x, i) => (
                    <li key={i}>
                      {x}
                      <button type="button" className="remove-item" onClick={() => removeItem(cons, setCons, i)}>×</button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => addItem(cons, setCons, '缺点')}>+ 添加</button>
              </>
            ) : (
              <ul>{cons.map((x, i) => <li key={i}>{x}</li>)}</ul>
            )}
          </div>
          <div className="list-field">
            <label>待观察</label>
            {editing ? (
              <>
                <ul>
                  {toObserve.map((x, i) => (
                    <li key={i}>
                      {x}
                      <button type="button" className="remove-item" onClick={() => removeItem(toObserve, setToObserve, i)}>×</button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => addItem(toObserve, setToObserve, '待观察项')}>+ 添加</button>
              </>
            ) : (
              <ul>{toObserve.map((x, i) => <li key={i}>{x}</li>)}</ul>
            )}
          </div>
          <div className="form-row">
            <label>标签</label>
            {editing ? (
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="用逗号分隔，如：细心, 幽默" />
            ) : (
              <div className="tags">{impression?.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
            )}
          </div>
          {(editing || personality || values || habits) && (
            <>
              <div className="form-row">
                <label>性格/三观</label>
                {editing ? (
                  <textarea value={personality} onChange={(e) => setPersonality(e.target.value)} rows={2} />
                ) : (
                  <p>{personality}</p>
                )}
              </div>
              <div className="form-row">
                <label>价值观</label>
                {editing ? (
                  <textarea value={values} onChange={(e) => setValues(e.target.value)} rows={2} />
                ) : (
                  <p>{values}</p>
                )}
              </div>
              <div className="form-row">
                <label>生活习惯</label>
                {editing ? (
                  <textarea value={habits} onChange={(e) => setHabits(e.target.value)} rows={2} />
                ) : (
                  <p>{habits}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {addModal && (
        <InputModal
          title={`添加${addModal.label}`}
          placeholder={`请输入${addModal.label}`}
          onConfirm={(v) => addModal.setter([...addModal.arr, v])}
          onCancel={() => setAddModal(null)}
        />
      )}
    </section>
  )
}

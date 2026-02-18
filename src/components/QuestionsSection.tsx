import { useState } from 'react'
import { CheckSquare } from 'lucide-react'
import type { PendingQuestion } from '../types'
import { db } from '../storage'
import { id, now } from '../utils'

interface Props {
  personId: string
  questions: PendingQuestion[]
  onRefresh: () => void
}

export default function QuestionsSection({ personId, questions, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [question, setQuestion] = useState('')

  const add = () => {
    if (!question.trim()) return
    db.questions.add({
      id: id(),
      personId,
      question: question.trim(),
      resolved: false,
      createdAt: now(),
    })
    setQuestion('')
    setShowForm(false)
    onRefresh()
  }

  const resolve = (q: PendingQuestion, note?: string) => {
    db.questions.update(q.id, (x) => ({
      ...x,
      resolved: true,
      resolvedNote: note,
      resolvedAt: now(),
    }))
    onRefresh()
  }

  const unresolve = (q: PendingQuestion) => {
    db.questions.update(q.id, (x) => ({
      ...x,
      resolved: false,
      resolvedNote: undefined,
      resolvedAt: undefined,
    }))
    onRefresh()
  }

  const remove = (id: string) => {
    db.questions.delete(id)
    onRefresh()
  }

  return (
    <section className="detail-section card">
      <div className="section-header">
        <h3><CheckSquare size={18} /> 待确认问题</h3>
        {!showForm ? (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>添加</button>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>取消</button>
        )}
      </div>

      {showForm && (
        <div className="inline-form">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="想了解的问题..."
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary btn-sm" onClick={add}>添加</button>
        </div>
      )}

      {questions.length === 0 && !showForm ? (
        <p className="empty-hint">暂无待确认问题</p>
      ) : (
        <ul className="question-list">
          {questions.map((q) => (
            <li key={q.id} className={q.resolved ? 'resolved' : ''}>
              <input
                type="checkbox"
                checked={q.resolved}
                onChange={() => (q.resolved ? unresolve(q) : resolve(q))}
              />
              <span className="q-text">{q.question}</span>
              {q.resolved && q.resolvedNote && <span className="q-note">{q.resolvedNote}</span>}
              <button type="button" className="remove-item" onClick={() => remove(q.id)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

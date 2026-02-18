import { useState } from 'react'
import { Download } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { PersonInfo } from '../types'
import { db } from '../storage'
import { STAGE_LABELS, MEET_CHANNEL_LABELS, DECISION_LABELS, PAID_BY_LABELS } from '../constants'
import { getDateTotalCost, formatCost } from '../utils-date'

interface Props {
  persons: PersonInfo[]
}

export default function ExportView({ persons }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formatType, setFormatType] = useState<'md' | 'txt'>('md')

  const exportOne = (p: PersonInfo) => {
    const dates = db.dates.getByPerson(p.id)
    const impression = db.impressions.getByPerson(p.id)
    const milestones = db.milestones.getByPerson(p.id)
    const questions = db.questions.getByPerson(p.id)
    const plan = db.plans.getByPerson(p.id)
    const decision = db.decisions.getByPerson(p.id)

    const lines: string[] = []

    lines.push(`# ${p.name} 相亲记录`)
    lines.push('')
    lines.push('## 基本信息')
    lines.push(`- 姓名：${p.name}`)
    if (p.age) lines.push(`- 年龄：${p.age}岁`)
    if (p.job) lines.push(`- 职业：${p.job}`)
    if (p.education) lines.push(`- 学历：${p.education}`)
    if (p.stage) lines.push(`- 阶段：${STAGE_LABELS[p.stage]}`)
    if (p.hobbies) lines.push(`- 爱好：${p.hobbies}`)
    if (p.familyBg) lines.push(`- 家庭：${p.familyBg}`)
    if (p.contact) lines.push(`- 联系：${p.contact}`)
    if (p.matchmaker) lines.push(`- 介绍人：${p.matchmaker}`)
    if (p.meetChannel) lines.push(`- 渠道：${MEET_CHANNEL_LABELS[p.meetChannel]}`)
    lines.push('')

    lines.push('## 约会记录')
    for (const d of dates) {
      lines.push(`### ${format(new Date(d.date), 'yyyy年M月d日', { locale: zhCN })}`)
      for (const it of d.items) {
        const loc = it.location ? `${it.location} - ` : ''
        const time = it.time ? `[${it.time}] ` : ''
        const costStr = it.cost != null && it.cost > 0
          ? ` ¥${formatCost(it.cost)}${it.paidBy ? ` (${PAID_BY_LABELS[it.paidBy]})` : ''}`
          : ''
        lines.push(`- ${time}${loc}${it.activity}${costStr}`)
      }
      if (d.miscExpenses?.length) {
        for (const m of d.miscExpenses) {
          lines.push(`- [零散] ${m.activity} ¥${formatCost(m.cost)} (${PAID_BY_LABELS[m.paidBy]})`)
        }
      }
      const total = getDateTotalCost(d)
      if (total > 0) lines.push(`- 合计：¥${formatCost(total)}`)
      if (d.notes) lines.push(`- 感想：${d.notes}`)
      lines.push('')
    }

    if (milestones.length) {
      lines.push('## 重要节点')
      for (const m of milestones) {
        lines.push(`- ${format(new Date(m.date), 'yyyy年M月d日', { locale: zhCN })} ${m.title}${m.notes ? `：${m.notes}` : ''}`)
      }
      lines.push('')
    }

    if (impression) {
      lines.push('## 印象评价')
      if (impression.pros.length) lines.push(`优点：${impression.pros.join('、')}`)
      if (impression.cons.length) lines.push(`缺点：${impression.cons.join('、')}`)
      if (impression.toObserve.length) lines.push(`待观察：${impression.toObserve.join('、')}`)
      if (impression.tags.length) lines.push(`标签：${impression.tags.join('、')}`)
      lines.push('')
    }

    if (questions.length) {
      lines.push('## 待确认问题')
      for (const q of questions) {
        lines.push(`- ${q.question}${q.resolved ? ` ✓ ${q.resolvedNote ?? ''}` : ''}`)
      }
      lines.push('')
    }

    if (plan) {
      lines.push('## 下次计划')
      lines.push(`- 日期：${plan.plannedDate ?? '-'}`)
      lines.push(`- 地点：${plan.plannedLocation ?? '-'}`)
      lines.push(`- 活动：${plan.plannedActivity ?? '-'}`)
      lines.push('')
    }

    if (decision) {
      lines.push('## 是否继续')
      lines.push(`- ${DECISION_LABELS[decision.decision]}`)
      if (decision.reason) lines.push(`- 原因：${decision.reason}`)
    }

    return formatType === 'md' ? lines.join('\n') : lines.map((l) => l.replace(/^#+\s*/, '')).join('\n')
  }

  const exportAll = () => {
    const chunks = persons.map((p) => exportOne(p))
    return chunks.join('\n\n---\n\n')
  }

  const handleExport = () => {
    const content = selectedId
      ? exportOne(persons.find((p) => p.id === selectedId)!)
      : exportAll()
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = selectedId ? `${persons.find((p) => p.id === selectedId)?.name}-相亲记录.${formatType}` : `相亲记录导出-${format(new Date(), 'yyyy-MM-dd')}.${formatType}`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="page export-page">
      <h2>导出</h2>
      <div className="export-form card">
        <div className="form-row">
          <label>导出范围</label>
          <select value={selectedId ?? ''} onChange={(e) => setSelectedId(e.target.value || null)}>
            <option value="">全部人选</option>
            {persons.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>格式</label>
          <select value={formatType} onChange={(e) => setFormatType(e.target.value as 'md' | 'txt')}>
            <option value="md">Markdown</option>
            <option value="txt">纯文本</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleExport}>
          <Download size={18} />
          下载导出文件
        </button>
      </div>
    </div>
  )
}

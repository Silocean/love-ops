import { useState } from 'react'
import type { PersonInfo } from '../types'
import { db } from '../storage'
import { getDateTotalCost, getDateCostByMe, getDateCostByThem, getDateSummary, formatCost } from '../utils-date'
import { STAGE_LABELS } from '../constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  persons: PersonInfo[]
}

export default function StatsView({ persons }: Props) {
  const [filterPersonId, setFilterPersonId] = useState<string>('')

  const allDatesRaw = db.dates.getAll()
  const allDates =
    filterPersonId === ''
      ? allDatesRaw
      : allDatesRaw.filter((d) => d.personId === filterPersonId)

  const totalDates = allDates.length
  const totalCost = allDates.reduce((s, d) => s + getDateTotalCost(d), 0)
  const costByMe = allDates.reduce((s, d) => s + getDateCostByMe(d), 0)
  const costByThem = allDates.reduce((s, d) => s + getDateCostByThem(d), 0)
  const avgCost = totalDates > 0 ? totalCost / totalDates : 0

  const filteredPersons = filterPersonId === '' ? persons : persons.filter((p) => p.id === filterPersonId)
  const byStage: Record<string, number> = {}
  for (const p of filteredPersons) {
    const s = p.stage ?? 'initial'
    byStage[s] = (byStage[s] ?? 0) + 1
  }

  const recentDates = [...allDates].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)

  return (
    <div className="page stats-page">
      <div className="stats-page-header">
        <h2>统计概览</h2>
        <div className="stats-filter">
          <label>对象筛选：</label>
          <select
            value={filterPersonId}
            onChange={(e) => setFilterPersonId(e.target.value)}
          >
            <option value="">全部</option>
            {persons.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card card">
          <div className="stat-value">{filteredPersons.length}</div>
          <div className="stat-label">相亲人选</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">{totalDates}</div>
          <div className="stat-label">总约会次数</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">¥{formatCost(totalCost)}</div>
          <div className="stat-label">累计花费</div>
        </div>
        <div className="stat-card card cost-me-card">
          <div className="stat-value">¥{formatCost(costByMe)}</div>
          <div className="stat-label">我出钱</div>
        </div>
        <div className="stat-card card cost-them-card">
          <div className="stat-value">¥{formatCost(costByThem)}</div>
          <div className="stat-label">对方出钱</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">¥{formatCost(avgCost)}</div>
          <div className="stat-label">平均单次花费</div>
        </div>
      </div>

      {allDates.length > 0 && (
        <section className="stats-section card">
          <h3>花费趋势</h3>
          <div className="cost-chart-by-date">
            {(() => {
              const sortedDates = [...allDates].sort((a, b) => a.date.localeCompare(b.date))
              const chartDates = sortedDates.slice(-15)
              const maxAmount = Math.max(
                ...chartDates.map((d) => getDateTotalCost(d)),
                1
              )
              const yLabels = [
                0,
                Math.ceil(maxAmount / 4),
                Math.ceil(maxAmount / 2),
                Math.ceil((maxAmount * 3) / 4),
                Math.ceil(maxAmount),
              ]
              return (
                <div className="date-chart">
                  <div className="chart-y-axis">
                    {yLabels.map((v) => (
                      <span key={v} className="y-label">
                        ¥{formatCost(v)}
                      </span>
                    ))}
                  </div>
                  <div className="chart-area">
                    <div
                      className="chart-bars"
                      style={{
                        gridTemplateColumns: `repeat(${chartDates.length}, 1fr)`,
                      }}
                    >
                      {chartDates.map((d) => {
                        const me = getDateCostByMe(d)
                        const them = getDateCostByThem(d)
                        const chartHeight = 140
                        const meHeight =
                          maxAmount > 0 && me > 0 ? Math.max((me / maxAmount) * chartHeight, 4) : 0
                        const themHeight =
                          maxAmount > 0 && them > 0 ? Math.max((them / maxAmount) * chartHeight, 4) : 0
                        return (
                          <div key={d.id} className="chart-bar-wrapper">
                            <div className="chart-bar-pair" style={{ height: chartHeight }}>
                              <div
                                className="chart-bar-single cost-me"
                                style={{ height: `${meHeight}px` }}
                                title={`我 ¥${formatCost(me)}`}
                              />
                              <div
                                className="chart-bar-single cost-them"
                                style={{ height: `${themHeight}px` }}
                                title={`对方 ¥${formatCost(them)}`}
                              />
                            </div>
                            <span className="chart-x-label">
                              {format(new Date(d.date), 'M/d', { locale: zhCN })}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
          <div className="chart-legend">
            <span className="legend-item cost-me">■ 我出钱</span>
            <span className="legend-item cost-them">■ 对方出钱</span>
          </div>
        </section>
      )}

      <section className="stats-section card">
        <h3>关系阶段分布</h3>
        <div className="stage-bars">
          {Object.entries(byStage).map(([stage, count]) => (
            <div key={stage} className="stage-bar">
              <span className="stage-label">{STAGE_LABELS[stage as keyof typeof STAGE_LABELS] ?? stage}</span>
              <div className="bar-wrap">
                <div
                  className="bar-fill"
                  style={{ width: `${filteredPersons.length > 0 ? (count / filteredPersons.length) * 100 : 0}%` }}
                />
              </div>
              <span className="stage-count">{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="stats-section card">
        <h3>最近约会</h3>
        {recentDates.length === 0 ? (
          <p className="empty-hint">暂无约会记录</p>
        ) : (
          <ul className="recent-list">
            {recentDates.map((d) => {
              const p = persons.find((x) => x.id === d.personId)
              const dayCost = getDateTotalCost(d)
              return (
                <li key={d.id}>
                  <span className="date">{format(new Date(d.date), 'M月d日', { locale: zhCN })}</span>
                  <span className="person">{p?.name ?? '?'}</span>
                  <span className="activity">{getDateSummary(d)}</span>
                  {dayCost > 0 && <span className="cost">¥{formatCost(dayCost)}</span>}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

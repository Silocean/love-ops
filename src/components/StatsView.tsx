import { useState, useEffect, useMemo } from 'react'
import type { PersonInfo } from '../types'
import type { DateRecord } from '../types'
import { db } from '../storage'
import { getDateTotalCost, getDateCostByMe, getDateCostByThem, getDateSummary, formatCost } from '../utils-date'
import { STAGE_LABELS, INITIATED_BY_LABELS } from '../constants'
import { format, startOfWeek, startOfMonth } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import SpendingLineChart, { type ChartPoint } from './SpendingLineChart'

interface Props {
  persons: PersonInfo[]
}

type TimeRange = 'all' | 'week' | 'month' | 'year'
type ChartType = 'bar' | 'line'
type ChartAggregation = 'date' | 'week' | 'month'

const getRangeStart = (range: TimeRange): string => {
  const now = new Date()
  switch (range) {
    case 'week': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return d.toISOString().slice(0, 10)
    }
    case 'month': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      return d.toISOString().slice(0, 10)
    }
    case 'year': {
      const d = new Date(now)
      d.setFullYear(d.getFullYear() - 1)
      return d.toISOString().slice(0, 10)
    }
    default:
      return '0000-01-01'
  }
}

const MOBILE_BREAKPOINT = 640

function aggregateDates(
  dates: DateRecord[],
  agg: ChartAggregation,
  getMe: (d: DateRecord) => number,
  getThem: (d: DateRecord) => number
): ChartPoint[] {
  const sorted = [...dates].sort((a, b) => a.date.localeCompare(b.date))
  if (agg === 'date') {
    return sorted.map((d) => ({
      label: format(new Date(d.date), 'M/d', { locale: zhCN }),
      me: getMe(d),
      them: getThem(d),
      date: d.date,
    }))
  }
  const map = new Map<string, { me: number; them: number; date: string }>()
  for (const d of sorted) {
    let key: string
    const dt = new Date(d.date)
    if (agg === 'week') {
      const start = startOfWeek(dt, { weekStartsOn: 1 })
      key = format(start, 'yyyy-MM-dd')
    } else {
      const start = startOfMonth(dt)
      key = format(start, 'yyyy-MM-dd')
    }
    const prev = map.get(key) ?? { me: 0, them: 0, date: key }
    prev.me += getMe(d)
    prev.them += getThem(d)
    map.set(key, prev)
  }
  const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  return entries.map(([date, { me, them }]) => ({
    label: agg === 'week'
      ? format(new Date(date), 'M/d', { locale: zhCN })
      : format(new Date(date), 'yyyy/M', { locale: zhCN }),
    me,
    them,
    date,
  }))
}

export default function StatsView({ persons }: Props) {
  const [filterPersonId, setFilterPersonId] = useState<string>('')
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [chartAggregation, setChartAggregation] = useState<ChartAggregation>('date')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const allDatesRaw = db.dates.getAll()
  const personFiltered =
    filterPersonId === ''
      ? allDatesRaw
      : allDatesRaw.filter((d) => d.personId === filterPersonId)

  const rangeStart = getRangeStart(timeRange)
  const allDates =
    timeRange === 'all'
      ? personFiltered
      : personFiltered.filter((d) => d.date >= rangeStart)

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

  const initiatedByMe = allDates.filter((d) => d.initiatedBy === 'me').length
  const initiatedByThem = allDates.filter((d) => d.initiatedBy === 'them').length

  const recentDates = [...allDates].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)

  const chartPoints = useMemo(
    () => aggregateDates(allDates, chartAggregation, getDateCostByMe, getDateCostByThem),
    [allDates, chartAggregation]
  )

  const barChartPoints = isMobile ? chartPoints.slice(-8) : chartPoints.slice(-15)

  return (
    <div className="page stats-page">
      <div className="stats-page-header card">
        <h2 className="stats-page-title">统计概览</h2>
        <div className="stats-filters">
          <div className="stats-filter">
            <label>对象</label>
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
          <div className="stats-filter">
            <label>时间</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            >
              <option value="all">全部</option>
              <option value="week">近一周</option>
              <option value="month">近一月</option>
              <option value="year">近一年</option>
            </select>
          </div>
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
          <h3>谁主动发起</h3>
          <div className="stats-cards stats-cards-small">
            <div className="stat-card card initiated-me-card">
              <div className="stat-value">{initiatedByMe}</div>
              <div className="stat-label">{INITIATED_BY_LABELS.me}</div>
            </div>
            <div className="stat-card card initiated-them-card">
              <div className="stat-value">{initiatedByThem}</div>
              <div className="stat-label">{INITIATED_BY_LABELS.them}</div>
            </div>
          </div>
          {(initiatedByMe + initiatedByThem) > 0 && (
            <div className="stage-bars" style={{ marginTop: '1rem' }}>
              {(['me', 'them'] as const).map((key) => {
                const count = key === 'me' ? initiatedByMe : initiatedByThem
                const total = initiatedByMe + initiatedByThem
                const pct = total > 0 ? (count / total) * 100 : 0
                return (
                  <div key={key} className="stage-bar">
                    <span className="stage-label">{INITIATED_BY_LABELS[key]}</span>
                    <div className="bar-wrap">
                      <div
                        className={`bar-fill ${key === 'me' ? 'initiated-me' : 'initiated-them'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="stage-count">{count} 次</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {allDates.length > 0 && (
        <section className="stats-section card">
          <div className="chart-section-header">
            <h3>花费趋势</h3>
            <div className="chart-controls">
              <div className="chart-type-toggle">
                <button
                  type="button"
                  className={chartType === 'line' ? 'active' : ''}
                  onClick={() => setChartType('line')}
                >
                  折线
                </button>
                <button
                  type="button"
                  className={chartType === 'bar' ? 'active' : ''}
                  onClick={() => setChartType('bar')}
                >
                  柱状
                </button>
              </div>
              <select
                className="chart-aggregation-select"
                value={chartAggregation}
                onChange={(e) => setChartAggregation(e.target.value as ChartAggregation)}
              >
                <option value="date">按次</option>
                <option value="week">按周</option>
                <option value="month">按月</option>
              </select>
            </div>
          </div>
          <div className="cost-chart-by-date">
            {chartType === 'line' ? (
              <SpendingLineChart points={chartPoints} formatCost={formatCost} />
            ) : (
              (() => {
                const pts = barChartPoints
                const maxAmount = Math.max(
                  ...pts.map((p) => p.me + p.them),
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
                    <div
                      className="chart-area"
                    >
                      <div
                        className="chart-bars"
                        style={{
                          gridTemplateColumns: `repeat(${pts.length}, 1fr)`,
                        }}
                      >
                        {pts.map((p, i) => {
                          const chartHeight = 140
                          const meHeight =
                            maxAmount > 0 && p.me > 0 ? Math.max((p.me / maxAmount) * chartHeight, 4) : 0
                          const themHeight =
                            maxAmount > 0 && p.them > 0 ? Math.max((p.them / maxAmount) * chartHeight, 4) : 0
                          return (
                            <div key={`${p.date}-${i}`} className="chart-bar-wrapper">
                              <div className="chart-bar-pair" style={{ height: chartHeight }}>
                                <div
                                  className="chart-bar-single cost-me"
                                  style={{ height: `${meHeight}px` }}
                                  title={`我 ¥${formatCost(p.me)}`}
                                />
                                <div
                                  className="chart-bar-single cost-them"
                                  style={{ height: `${themHeight}px` }}
                                  title={`对方 ¥${formatCost(p.them)}`}
                                />
                              </div>
                              <span className="chart-x-label">{p.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })()
            )}
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

      {allDates.length > 0 && (() => {
        const locationCount: Record<string, number> = {}
        for (const d of allDates) {
          for (const it of d.items) {
            if (it.location?.trim()) {
              const loc = it.location.trim()
              locationCount[loc] = (locationCount[loc] ?? 0) + 1
            }
          }
        }
        const topLocations = Object.entries(locationCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
        return topLocations.length > 0 ? (
          <section className="stats-section card">
            <h3>常去地点</h3>
            <ul className="location-stats">
              {topLocations.map(([loc, count]) => (
                <li key={loc}>
                  <span className="location-name">{loc}</span>
                  <span className="location-count">{count} 次</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null
      })()}

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

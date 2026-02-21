import { useState, useEffect, useRef } from 'react'

export interface ChartPoint {
  label: string
  me: number
  them: number
  date: string
}

interface Props {
  points: ChartPoint[]
  formatCost: (n: number) => string
}

export default function SpendingLineChart({ points, formatCost }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(400)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (typeof w === 'number' && w > 0) setChartWidth(Math.round(w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (points.length === 0) return null

  const padding = { top: 12, right: 8, bottom: 28, left: 48 }
  const strokeWidth = 2
  const dotRadius = 4

  const allValues = points.flatMap((p) => [p.me, p.them])
  const maxAmount = Math.max(...allValues, 1)

  const chartHeight = 140
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const toY = (v: number) =>
    padding.top + innerHeight - (maxAmount > 0 ? (v / maxAmount) * innerHeight : 0)
  const toX = (i: number) =>
    padding.left + (points.length <= 1 ? innerWidth / 2 : (i / (points.length - 1)) * innerWidth)

  const mePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.me)}`)
    .join(' ')
  const themPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.them)}`)
    .join(' ')

  const yLabels = [0, maxAmount / 4, maxAmount / 2, (maxAmount * 3) / 4, maxAmount].map((v) =>
    Math.ceil(v)
  )

  return (
    <div ref={wrapRef} className="line-chart-wrap">
      <svg
        className="line-chart"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="xMinYMid meet"
      >
        <defs>
          <linearGradient id="line-me-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line-them-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yLabels.map((v) => (
          <g key={v}>
            <line
              x1={padding.left}
              y1={toY(v)}
              x2={chartWidth - padding.right}
              y2={toY(v)}
              stroke="var(--border)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
            <text
              x={padding.left - 6}
              y={toY(v) + 4}
              textAnchor="end"
              fontSize="10"
              fill="var(--text-muted)"
            >
              ¥{formatCost(v)}
            </text>
          </g>
        ))}
        <path
          d={mePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={themPath}
          fill="none"
          stroke="var(--success)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={toX(i)}
              cy={toY(p.me)}
              r={dotRadius}
              fill="var(--accent)"
              stroke="var(--bg-card)"
              strokeWidth="2"
            />
            <circle
              cx={toX(i)}
              cy={toY(p.them)}
              r={dotRadius}
              fill="var(--success)"
              stroke="var(--bg-card)"
              strokeWidth="2"
            />
          </g>
        ))}
        {points.map((p, i) => (
          <text
            key={i}
            x={toX(i)}
            y={chartHeight - 6}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-muted)"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

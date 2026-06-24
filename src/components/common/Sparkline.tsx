import { useMemo } from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export function Sparkline({ data, width = 100, height = 40, color = '#0ECB81' }: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return ''

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
  }, [data, width, height])

  if (data.length < 2) {
    return (
      <svg width={width} height={height} className="opacity-30">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth="1" />
      </svg>
    )
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L ${width},${height} L 0,${height} Z`}
        fill={`url(#sparkline-gradient-${color.replace('#', '')})`}
      />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

import { useMemo } from 'react'
import { CHART_PRIMARY } from './chartTheme'

interface Props {
  values: (number | null | undefined)[]
  width?: number
  height?: number
  color?: string
  positiveColor?: string
  negativeColor?: string
  showFill?: boolean
  className?: string
}

export default function MiniSparkline({
  values,
  width = 80,
  height = 24,
  color = CHART_PRIMARY,
  positiveColor,
  negativeColor,
  showFill = false,
  className,
}: Props) {
  const { cleaned, min, max, range, firstVal, lastVal } = useMemo(() => {
    const cleaned = values.filter((v): v is number => v != null && !isNaN(v) && v !== Infinity && v !== -Infinity)
    if (cleaned.length < 2) return { cleaned, min: 0, max: 0, range: 1, firstVal: 0, lastVal: 0 }
    const min = Math.min(...cleaned)
    const max = Math.max(...cleaned)
    return { cleaned, min, max, range: max - min || 1, firstVal: cleaned[0], lastVal: cleaned[cleaned.length - 1] }
  }, [values])

  const strokeColor = useMemo(() => {
    if (positiveColor && lastVal >= firstVal) return positiveColor
    if (negativeColor && lastVal < firstVal) return negativeColor
    return color
  }, [color, positiveColor, negativeColor, firstVal, lastVal])

  if (cleaned.length < 2) return <svg width={width} height={height} className={className} />

  const pad = 1
  const dw = width - pad * 2
  const dh = height - pad * 2

  const points = cleaned
    .map((v, i) => {
      const x = pad + (i / (cleaned.length - 1)) * dw
      const y = pad + (1 - (v - min) / range) * dh
      return `${x},${y}`
    })
    .join(' ')

  const areaPoints = `${points} ${width - pad},${height} ${pad},${height}`

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      {showFill && (
        <polygon fill={strokeColor} fillOpacity={0.08} points={areaPoints} />
      )}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

import type { GovernanceState } from './governance'
import { getStateMeta } from './governance'

interface StatePillProps {
  state: GovernanceState
  className?: string
  size?: 'sm' | 'md'
}

const fillStates: Set<GovernanceState> = new Set(['GREEN', 'RED'])

const sizeStyles = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-[11px] px-2 py-0.5',
}

export default function StatePill({ state, className = '', size = 'sm' }: StatePillProps) {
  const meta = getStateMeta(state)
  const isFilled = fillStates.has(state)

  return (
    <span
      className={`inline-flex items-center rounded font-semibold tracking-wide uppercase border ${sizeStyles[size]} ${
        isFilled
          ? `${meta.fill} border-gov-${state === 'GREEN' ? 'green' : 'red'}/30`
          : `${meta.border} ${meta.motion}`
      } ${className}`}
    >
      {state}
    </span>
  )
}

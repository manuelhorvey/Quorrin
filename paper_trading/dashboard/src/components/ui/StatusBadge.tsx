import type { GovernanceState } from './governance'
import { getStateMeta } from './governance'

interface StatusBadgeProps {
  state: GovernanceState
  pulse?: boolean
  className?: string
}

const fillStates: Set<GovernanceState> = new Set(['GREEN', 'RED'])

export default function StatusBadge({ state, pulse = false, className = '' }: StatusBadgeProps) {
  const meta = getStateMeta(state)
  const isFilled = fillStates.has(state)

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold tracking-wide uppercase ${
        isFilled
          ? `${meta.fill} border-gov-${state === 'GREEN' ? 'green' : 'red'}/30`
          : `${meta.border} ${pulse ? meta.motion : ''}`
      } ${className}`}
    >
      {state}
    </span>
  )
}

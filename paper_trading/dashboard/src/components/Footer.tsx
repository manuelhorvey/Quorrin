import { usePortfolioState } from '../hooks/usePortfolioState'

export default function Footer() {
  const { data } = usePortfolioState()
  const p = data?.portfolio
  const startDate = p?.start_date
  const gateDate = startDate ? new Date(new Date(startDate).getTime() + 180 * 86400000) : null

  return (
    <footer className="border-t border-default px-6 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[10px] text-tertiary">
        <span>
          Next retrain: <span className="text-secondary font-medium">Jan 1, {new Date().getFullYear() + 1}</span>
        </span>
        <div className="flex items-center gap-3">
          <span>
            Started: <span className="text-secondary font-medium">{startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
          </span>
          <span>
            Gate: <span className="text-secondary font-medium">{gateDate ? gateDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
          </span>
          <span>
            Cleared: <span className={`font-medium ${p?.deployment_cleared ? 'text-emerald-400' : 'text-amber-400'}`}>{p?.deployment_cleared ? 'Yes' : 'No'}</span>
          </span>
        </div>
      </div>
    </footer>
  )
}

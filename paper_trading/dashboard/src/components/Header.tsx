import { useEffect, useState } from 'react'
import { usePortfolioState } from '../hooks/usePortfolioState'
import { useSessionClock } from '../hooks/useSessionClock'
import { useQueryClient } from '@tanstack/react-query'

export default function Header() {
  const { dataUpdatedAt, isError, isFetching, data } = usePortfolioState()
  const { timeStr, dateStr, marketsOpen } = useSessionClock()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const staleness = dataUpdatedAt ? Date.now() - dataUpdatedAt : Infinity
  const isLive = !isError && staleness <= 35_000
  const isDelayed = !isError && staleness > 35_000 && staleness <= 120_000
  const statusColor = isError ? 'text-red-400' : isDelayed ? 'text-amber-400' : 'text-emerald-400'
  const statusText = isError ? 'Disconnected' : isDelayed ? 'Delayed' : 'Live'
  const daysRunning = data?.portfolio?.days_running ?? 0
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries()
    setTimeout(() => setRefreshing(false), 800)
  }

  return (
    <header className="sticky top-0 z-30 glass glass-border border-t-0 border-x-0">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-sm font-bold tracking-tight text-primary">QuantForge</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${isError ? 'border-red-500/20 bg-red-500/5' : isDelayed ? 'border-amber-500/20 bg-amber-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
            <span className={`relative inline-flex w-1.5 h-1.5 rounded-full ${statusColor} ${isLive ? 'animate-pulse' : ''}`}>
              {isLive && (
                <span className={`absolute inset-0 rounded-full ${statusColor} animate-ping opacity-30`} />
              )}
            </span>
            <span className={`text-[10px] font-medium font-mono ${statusColor}`}>{statusText}</span>
            {isFetching && (
              <svg className="w-2.5 h-2.5 text-tertiary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-secondary">
            <svg className="w-3 h-3 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span>{dateStr}</span>
            <span className="font-mono text-secondary">{timeStr}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
              marketsOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {marketsOpen ? 'OPEN' : 'CLSD'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-secondary">
            <svg className="w-3 h-3 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono text-secondary">{daysRunning > 0 ? `${daysRunning}d` : '—'}</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 rounded-lg border border-default hover:border-strong transition-colors bg-surface disabled:opacity-50"
            title="Refresh all data"
          >
            <svg className={`w-3 h-3 text-secondary ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>

          <button
            onClick={() => setDark(d => !d)}
            className="p-1 rounded-lg border border-default hover:border-strong transition-colors bg-surface"
            title="Toggle theme"
          >
            {dark ? (
              <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

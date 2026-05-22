interface Props {
  children?: React.ReactNode
}

const tickers = [
  { name: 'AUDJPY', signal: 'SELL', color: 'text-red-400', dot: 'bg-red-500' },
  { name: 'GBPUSD', signal: 'SELL', color: 'text-red-400', dot: 'bg-red-500' },
  { name: 'USDJPY', signal: 'BUY', color: 'text-emerald-400', dot: 'bg-emerald-500' },
  { name: 'GC', signal: 'BUY', color: 'text-emerald-400', dot: 'bg-emerald-500' },
  { name: 'EURCAD', signal: 'BUY', color: 'text-emerald-400', dot: 'bg-emerald-500' },
]

export default function HeroReveal({ children }: Props) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-950 select-none flex flex-col items-center justify-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/3 blur-[100px]" />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />
      <h1 className="text-white text-6xl sm:text-7xl font-semibold tracking-tight">
        QuantForge
      </h1>
      <p className="text-gray-400 text-lg sm:text-xl mt-3 font-medium">
        Macro-driven. Regime-aware.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {tickers.map((a) => (
          <span key={a.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-gray-800/80 text-gray-300 border border-gray-700/50">
            <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
            {a.name}
            <span className={a.color}>{a.signal}</span>
          </span>
        ))}
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
        <span className="text-gray-600 text-xs tracking-wider uppercase">Scroll to explore</span>
        <svg className="w-4 h-4 text-gray-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      {children}
    </div>
  )
}

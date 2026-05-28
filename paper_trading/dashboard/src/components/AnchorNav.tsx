import { useEffect, useState } from 'react'

export const NAV_SECTIONS = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'signals', label: 'Signals' },
  { id: 'execution', label: 'Execution' },
  { id: 'trades', label: 'Trades' },
  { id: 'governance', label: 'Governance' },
  { id: 'risk', label: 'Risk' },
  { id: 'charts', label: 'Charts' },
  { id: 'alert-feed', label: 'Alerts' },
  { id: 'engine-logs', label: 'Logs' },
]

export default function AnchorNav() {
  const [active, setActive] = useState('portfolio')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    )

    for (const { id } of NAV_SECTIONS) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <nav className="sticky top-[45px] sm:top-[49px] z-20 bg-app/80 backdrop-blur-md border-b border-default/60">
      <div className="max-w-[90rem] mx-auto px-3 sm:px-6 flex items-center gap-0 overflow-x-auto scrollbar-none">
        {NAV_SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={e => {
              e.preventDefault()
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
            }}
            className={`shrink-0 px-3 py-1.5 text-2xs font-medium transition-colors border-b-2 ${
              active === id
                ? 'text-primary border-accent-emerald'
                : 'text-tertiary border-transparent hover:text-secondary hover:border-default/40'
            }`}
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  )
}

import type { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  className?: string
  padding?: 'md' | 'lg' | 'none'
}

const paddingMap = {
  md: 'p-3.5 sm:p-4',
  lg: 'p-4 sm:p-5',
  none: '',
}

export default function Panel({ children, className = '', padding = 'md' }: PanelProps) {
  return (
    <div className={['panel rounded-lg', paddingMap[padding], className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

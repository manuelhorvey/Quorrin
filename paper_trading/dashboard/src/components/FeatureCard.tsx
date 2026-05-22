import { useState, useCallback, ReactNode, isValidElement, Children, cloneElement } from 'react'
import { useTilt } from '../hooks/useTilt'

interface Props {
  title: string
  label: string
  children: ReactNode
}

export default function FeatureCard({ title, label, children }: Props) {
  const { ref, onMouseMove, onMouseLeave } = useTilt()
  const [hovered, setHovered] = useState(false)

  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    onMouseLeave()
  }, [onMouseLeave])

  const kids = Children.map(children, (child) => {
    if (isValidElement(child)) {
      return cloneElement(child as React.ReactElement<{ hovered: boolean }>, { hovered })
    }
    return child
  })

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative bg-gray-950 border rounded-xl p-4 transition-all duration-300 will-change-transform ${
        hovered ? 'border-gray-500' : 'border-gray-800'
      }`}
      style={{
        boxShadow: hovered ? 'inset 0 0 80px rgba(255,255,255,0.03)' : 'none',
      }}
    >
      <h3 className="text-white font-semibold text-sm mb-2">{title}</h3>
      <div className="mb-2 min-h-[60px]">{kids}</div>
      <p className="text-gray-500 text-xs">{label}</p>
    </div>
  )
}

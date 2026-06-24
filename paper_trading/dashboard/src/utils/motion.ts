export const MOTION = {
  duration: {
    interaction: 150,
    normal: 200,
    slow: 300,
    data: 500,
  },
  ease: {
    interaction: 'ease',
    presence: 'ease-out',
    data: 'ease-out',
    emphasis: [0.34, 1.56, 0.64, 1] as const,
  },
  className: {
    interaction: 'transition-colors duration-150',
    hover: 'transition-all duration-200',
    presence: 'animate-fade-in',
    sidebar: 'transform transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    data: 'transition-all duration-500',
    button: 'transition-all duration-150 active:scale-[0.98]',
    card: 'transition-all duration-200 hover:border-strong hover:shadow-card',
  },
} as const

export type MotionToken = keyof typeof MOTION.className

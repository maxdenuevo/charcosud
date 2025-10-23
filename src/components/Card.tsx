import { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ title, children, className = '', onClick }: CardProps) {
  const cardClasses = [
    'card',
    onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : '',
    className,
  ].join(' ')

  return (
    <div className={cardClasses} onClick={onClick}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      )}
      {children}
    </div>
  )
}

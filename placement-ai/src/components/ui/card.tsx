import React from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  onClick,
  tone = 'default'
}: CardProps) => {
  const baseClasses = 'bg-white border rounded-lg shadow-sm'
  const toneClasses = {
    default: 'border-accent-200',
    success: 'border-status-success/30 bg-emerald-50',
    warning: 'border-status-warning/30 bg-amber-50',
    danger: 'border-status-danger/30 bg-red-50',
    info: 'border-status-info/30 bg-blue-50'
  } as const
  const hoverClasses = hover ? 'hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer' : ''
  const clickClasses = onClick ? 'cursor-pointer' : ''
  
  const classes = `${baseClasses} ${toneClasses[tone]} ${hoverClasses} ${clickClasses} ${className}`
  
  const Component = onClick ? motion.div : 'div'
  
  const motionProps = onClick ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 }
  } : {}
  
  return (
    <Component
      className={classes}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </Component>
  )
}

// Card sub-components
export const CardHeader = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
)

export const CardTitle = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
)

export const CardDescription = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>
    {children}
  </p>
)

export const CardContent = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
)

export const CardFooter = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) => (
  <div className={`px-6 py-4 border-t border-gray-200 ${className}`}>
    {children}
  </div>
)

export default Card
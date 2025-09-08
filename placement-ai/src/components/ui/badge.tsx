import React from 'react'
import { motion } from 'framer-motion'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'destructive' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className = '',
  onClick 
}: BadgeProps) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    outline: 'border border-gray-300 text-gray-700 bg-white',
    destructive: 'bg-red-500 text-white',
    secondary: 'bg-gray-200 text-gray-800'
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm'
  }
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${
    onClick ? 'cursor-pointer hover:opacity-80' : ''
  } ${className}`
  
  const Component = onClick ? motion.span : 'span'
  
  const motionProps = onClick ? {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
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

// Status badge for job applications, etc.
export const StatusBadge = ({ 
  status, 
  className = '' 
}: { 
  status: 'pending' | 'approved' | 'rejected' | 'interview' | 'offered' | 'accepted'
  className?: string 
}) => {
  const statusConfig = {
    pending: { variant: 'warning' as const, text: 'Pending' },
    approved: { variant: 'success' as const, text: 'Approved' },
    rejected: { variant: 'error' as const, text: 'Rejected' },
    interview: { variant: 'info' as const, text: 'Interview' },
    offered: { variant: 'success' as const, text: 'Offered' },
    accepted: { variant: 'success' as const, text: 'Accepted' }
  }
  
  const config = statusConfig[status]
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.text}
    </Badge>
  )
}

// Skill badge for job tags
export const SkillBadge = ({ 
  skill, 
  onRemove,
  className = '' 
}: { 
  skill: string
  onRemove?: () => void
  className?: string 
}) => (
  <Badge 
    variant="outline" 
    className={`${onRemove ? 'pr-1' : ''} ${className}`}
  >
    <span>{skill}</span>
    {onRemove && (
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </Badge>
)

// Notification badge with count
export const NotificationBadge = ({ 
  count, 
  children, 
  className = '' 
}: { 
  count: number
  children: React.ReactNode
  className?: string 
}) => (
  <div className={`relative inline-block ${className}`}>
    {children}
    {count > 0 && (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
      >
        {count > 99 ? '99+' : count}
      </motion.span>
    )}
  </div>
)

export default Badge

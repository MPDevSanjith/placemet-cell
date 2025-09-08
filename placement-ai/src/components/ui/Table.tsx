import React from 'react'
import { motion } from 'framer-motion'

interface TableProps {
  children: React.ReactNode
  className?: string
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

interface TableHeadProps {
  children: React.ReactNode
  className?: string
  sortable?: boolean
  onSort?: () => void
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

const Table = ({ children, className = '' }: TableProps) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="min-w-full divide-y divide-gray-200">
      {children}
    </table>
  </div>
)

const TableHeader = ({ children, className = '' }: TableHeaderProps) => (
  <thead className={`bg-gray-50 ${className}`}>
    {children}
  </thead>
)

const TableBody = ({ children, className = '' }: TableBodyProps) => (
  <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
    {children}
  </tbody>
)

const TableRow = ({ children, className = '', hover = false, onClick }: TableRowProps) => {
  const RowComponent = hover ? motion.tr : 'tr'
  
  const motionProps = hover ? {
    whileHover: { backgroundColor: '#f9fafb' },
    transition: { duration: 0.2 }
  } : {}
  
  return (
    <RowComponent
      className={`${hover ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </RowComponent>
  )
}

const TableHead = ({ children, className = '', sortable = false, onSort }: TableHeadProps) => (
  <th
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
      sortable ? 'cursor-pointer hover:bg-gray-100' : ''
    } ${className}`}
    onClick={sortable ? onSort : undefined}
  >
    <div className="flex items-center gap-1">
      {children}
      {sortable && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )}
    </div>
  </th>
)

const TableCell = ({ children, className = '', align = 'left' }: TableCellProps) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${alignClasses[align]} ${className}`}>
      {children}
    </td>
  )
}

// Empty state component
export const TableEmpty = ({ 
  message = 'No data available',
  icon,
  action
}: { 
  message?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}) => (
  <tr>
    <td colSpan={100} className="px-6 py-12 text-center">
      <div className="flex flex-col items-center gap-4">
        {icon && <div className="text-gray-400">{icon}</div>}
        <p className="text-gray-500 text-sm">{message}</p>
        {action && <div>{action}</div>}
      </div>
    </td>
  </tr>
)

// Loading state component
export const TableLoading = ({ colSpan = 1 }: { colSpan?: number }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-12 text-center">
      <div className="flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    </td>
  </tr>
)

export {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
}

export default Table

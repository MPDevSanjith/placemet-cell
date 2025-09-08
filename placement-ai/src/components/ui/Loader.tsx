import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
  fullScreen?: boolean
}

const Loader = ({ 
  size = 'md', 
  text, 
  className = '',
  fullScreen = false 
}: LoaderProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }
  
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className={`${sizeClasses[size]} text-primary-500`} />
      </motion.div>
      {text && (
        <motion.p
          className={`text-gray-600 ${textSizeClasses[size]}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        {content}
      </div>
    )
  }
  
  return content
}

// Spinner component for inline use
export const Spinner = ({ size = 'sm', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }
  
  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <Loader2 className="w-full h-full text-primary-500" />
    </motion.div>
  )
}

// Dots loader
export const DotsLoader = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-1 ${className}`}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-primary-500 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.2
        }}
      />
    ))}
  </div>
)

// Pulse loader
export const PulseLoader = ({ className = '' }: { className?: string }) => (
  <motion.div
    className={`w-8 h-8 bg-primary-500 rounded-full ${className}`}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5]
    }}
    transition={{
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
  />
)

export default Loader

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Star, TrendingUp, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BoostType = 'featured' | 'urgent' | 'premium' | 'sponsored'

interface BoostedJobBadgeProps {
  type: BoostType
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

const boostConfig = {
  featured: {
    label: 'Featured',
    icon: Star,
    className: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
    glowColor: 'shadow-yellow-200',
    description: 'Highlighted in search results'
  },
  urgent: {
    label: 'Urgent',
    icon: Zap,
    className: 'bg-gradient-to-r from-red-500 to-pink-600 text-white',
    glowColor: 'shadow-red-200',
    description: 'Immediate start required'
  },
  premium: {
    label: 'Premium',
    icon: Crown,
    className: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
    glowColor: 'shadow-purple-200',
    description: 'Top placement in listings'
  },
  sponsored: {
    label: 'Sponsored',
    icon: TrendingUp,
    className: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
    glowColor: 'shadow-blue-200',
    description: 'Promoted by employer'
  }
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base'
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
}

export function BoostedJobBadge({ 
  type, 
  className, 
  showIcon = true, 
  size = 'md',
  animated = true 
}: BoostedJobBadgeProps) {
  const config = boostConfig[type]
  const Icon = config.icon

  return (
    <motion.div
      initial={animated ? { scale: 0, opacity: 0 } : undefined}
      animate={animated ? { scale: 1, opacity: 1 } : undefined}
      transition={animated ? { 
        type: 'spring', 
        stiffness: 300, 
        damping: 20,
        delay: 0.1 
      } : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        'ring-2 ring-white/20 backdrop-blur-sm',
        'transition-all duration-300 hover:scale-105',
        config.className,
        sizeClasses[size],
        animated && 'animate-pulse-glow',
        className
      )}
      title={config.description}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
      
      {/* Glow effect */}
      {animated && (
        <div 
          className={cn(
            'absolute inset-0 rounded-full opacity-75 blur-md -z-10',
            config.className
          )}
        />
      )}
    </motion.div>
  )
}

// Utility component for multiple boost badges
interface BoostedJobBadgesProps {
  boosts: BoostType[]
  className?: string
  size?: 'sm' | 'md' | 'lg'
  maxVisible?: number
  showIcon?: boolean
  animated?: boolean
}

export function BoostedJobBadges({ 
  boosts, 
  className, 
  size = 'md',
  maxVisible = 3,
  showIcon = true,
  animated = true 
}: BoostedJobBadgesProps) {
  const visibleBoosts = boosts.slice(0, maxVisible)
  const remainingCount = boosts.length - maxVisible

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {visibleBoosts.map((boost, index) => (
        <BoostedJobBadge
          key={boost}
          type={boost}
          size={size}
          showIcon={showIcon}
          animated={animated}
          style={animated ? { animationDelay: `${index * 100}ms` } : undefined}
        />
      ))}
      
      {remainingCount > 0 && (
        <div className={cn(
          'inline-flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium',
          sizeClasses[size]
        )}>
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

// Helper component for boost priority ordering
export function getBoostPriority(boost: BoostType): number {
  const priorities = {
    premium: 4,
    featured: 3,
    urgent: 2,
    sponsored: 1
  }
  return priorities[boost] || 0
}

// Export individual boost configs for external use
export { boostConfig }
export default BoostedJobBadge
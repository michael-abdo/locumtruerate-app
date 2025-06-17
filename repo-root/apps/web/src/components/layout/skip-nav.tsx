'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkipNavProps {
  className?: string
  children?: React.ReactNode
}

export const SkipNav: React.FC<SkipNavProps> = ({ 
  className,
  children = 'Skip to main content'
}) => {
  return (
    <a
      href="#main-content"
      className={cn(
        'sr-only focus:not-sr-only',
        'fixed top-4 left-4 z-[9999]',
        'bg-primary text-primary-foreground',
        'px-4 py-2 rounded-md text-sm font-medium',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  )
}

interface SkipNavLinksProps {
  links?: Array<{
    href: string
    label: string
  }>
}

export const SkipNavLinks: React.FC<SkipNavLinksProps> = ({ 
  links = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' },
  ]
}) => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <div className="fixed top-4 left-4 z-[9999] flex flex-col gap-2">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className={cn(
              'bg-primary text-primary-foreground',
              'px-4 py-2 rounded-md text-sm font-medium',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'transition-all duration-200'
            )}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { BreadcrumbStructuredData } from './structured-data'

interface BreadcrumbItem {
  name: string
  url: string
  current?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const allItems = [
    { name: 'Home', url: '/' },
    ...items
  ]

  return (
    <>
      <BreadcrumbStructuredData items={allItems} />
      <nav className={`flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 ${className}`} aria-label="Breadcrumb">
        <Link
          href="/"
          className="flex items-center hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <Home className="h-4 w-4" />
          <span className="sr-only">Home</span>
        </Link>
        
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {item.current ? (
              <span className="font-medium text-gray-900 dark:text-gray-100" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link
                href={item.url}
                className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </>
  )
}
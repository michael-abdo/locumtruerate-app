import * as React from 'react'
import { cn } from '@/lib/utils'
import { 
  Skeleton, 
  SkeletonText, 
  SkeletonTitle, 
  SkeletonButton 
} from '@locumtruerate/ui'

interface ComparisonSkeletonProps {
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
  itemCount?: number
  showChart?: boolean
  layout?: 'side-by-side' | 'table' | 'cards'
  className?: string
}

export function ComparisonSkeleton({
  variant = 'default',
  animation = 'pulse',
  itemCount = 2,
  showChart = true,
  layout = 'side-by-side',
  className
}: ComparisonSkeletonProps) {
  return (
    <div 
      className={cn('w-full space-y-8', className)}
      role="status"
      aria-label={`Loading comparison of ${itemCount} items`}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <SkeletonTitle
          width="60%"
          height="2.5rem"
          variant={variant}
          animation={animation}
          className="mx-auto"
        />
        <SkeletonText
          width="80%"
          variant={variant}
          animation={animation}
          className="mx-auto"
        />
      </div>

      {/* Quick Summary */}
      <div className="p-6 border rounded-lg bg-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <SkeletonText width="60%" variant={variant} animation={animation} className="mx-auto" />
            <SkeletonTitle width="40%" variant={variant} animation={animation} className="mx-auto" />
          </div>
          <div className="space-y-2">
            <SkeletonText width="70%" variant={variant} animation={animation} className="mx-auto" />
            <SkeletonTitle width="50%" variant={variant} animation={animation} className="mx-auto" />
          </div>
          <div className="space-y-2">
            <SkeletonText width="50%" variant={variant} animation={animation} className="mx-auto" />
            <SkeletonTitle width="35%" variant={variant} animation={animation} className="mx-auto" />
          </div>
        </div>
      </div>

      {/* Main Comparison */}
      {layout === 'side-by-side' && (
        <SideBySideComparisonSkeleton
          itemCount={itemCount}
          variant={variant}
          animation={animation}
        />
      )}

      {layout === 'table' && (
        <TableComparisonSkeleton
          itemCount={itemCount}
          variant={variant}
          animation={animation}
        />
      )}

      {layout === 'cards' && (
        <CardsComparisonSkeleton
          itemCount={itemCount}
          variant={variant}
          animation={animation}
        />
      )}

      {/* Chart Comparison */}
      {showChart && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ComparisonChartSkeleton
            title="Net Income Comparison"
            variant={variant}
            animation={animation}
          />
          <ComparisonChartSkeleton
            title="Tax Burden Comparison"
            variant={variant}
            animation={animation}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <SkeletonButton
          size="lg"
          width="160px"
          variant={variant}
          animation={animation}
        />
        <SkeletonButton
          size="lg"
          width="140px"
          variant={variant}
          animation={animation}
        />
        <SkeletonButton
          size="lg"
          width="120px"
          variant={variant}
          animation={animation}
        />
      </div>
    </div>
  )
}

// Side-by-side comparison skeleton
interface ComparisonItemSkeletonProps {
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
  itemCount: number
}

function SideBySideComparisonSkeleton({
  itemCount,
  variant = 'default',
  animation = 'pulse'
}: ComparisonItemSkeletonProps) {
  return (
    <div className={cn(
      'grid gap-6',
      itemCount === 2 ? 'grid-cols-1 lg:grid-cols-2' :
      itemCount === 3 ? 'grid-cols-1 lg:grid-cols-3' :
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    )}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <div key={index} className="border rounded-lg bg-card">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="text-center space-y-3">
              <SkeletonTitle
                width="70%"
                variant={variant}
                animation={animation}
                className="mx-auto"
              />
              <SkeletonText
                width="60%"
                variant={variant}
                animation={animation}
                className="mx-auto"
              />
            </div>
          </div>

          {/* Key metrics */}
          <div className="p-6 space-y-6">
            {/* Primary metric */}
            <div className="text-center space-y-2">
              <SkeletonText
                width="50%"
                variant={variant}
                animation={animation}
                className="mx-auto"
              />
              <SkeletonTitle
                width="60%"
                height="2rem"
                variant={variant}
                animation={animation}
                className="mx-auto"
              />
            </div>

            {/* Secondary metrics */}
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, metricIndex) => (
                <div key={metricIndex} className="flex justify-between items-center">
                  <SkeletonText
                    width={`${50 + (metricIndex * 10)}%`}
                    variant={variant}
                    animation={animation}
                  />
                  <SkeletonText
                    width="30%"
                    variant={variant}
                    animation={animation}
                  />
                </div>
              ))}
            </div>

            {/* Breakdown section */}
            <div className="pt-4 border-t space-y-3">
              <SkeletonText
                width="40%"
                variant={variant}
                animation={animation}
              />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, breakdownIndex) => (
                  <div key={breakdownIndex} className="flex justify-between items-center text-sm">
                    <SkeletonText
                      width={`${40 + (breakdownIndex * 15)}%`}
                      height="0.875rem"
                      variant={variant}
                      animation={animation}
                    />
                    <SkeletonText
                      width="25%"
                      height="0.875rem"
                      variant={variant}
                      animation={animation}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Table comparison skeleton
function TableComparisonSkeleton({
  itemCount,
  variant = 'default',
  animation = 'pulse'
}: ComparisonItemSkeletonProps) {
  const metrics = [
    'Gross Income',
    'Federal Tax',
    'State Tax',
    'Social Security',
    'Medicare',
    'Net Income',
    'Effective Tax Rate',
    'Take Home %'
  ]

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 text-left">
                <SkeletonText width="60px" variant={variant} animation={animation} />
              </th>
              {Array.from({ length: itemCount }).map((_, index) => (
                <th key={index} className="p-4 text-center">
                  <SkeletonText 
                    width="100px" 
                    variant={variant} 
                    animation={animation} 
                    className="mx-auto"
                  />
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y">
            {metrics.map((metric, metricIndex) => (
              <tr key={metric} className={metricIndex === metrics.length - 2 ? 'border-t-2 border-primary/20' : ''}>
                <td className="p-4 font-medium">
                  <SkeletonText 
                    width={`${80 + (metricIndex * 10)}px`} 
                    variant={variant} 
                    animation={animation} 
                  />
                </td>
                {Array.from({ length: itemCount }).map((_, index) => (
                  <td key={index} className="p-4 text-center">
                    <SkeletonText 
                      width="80px" 
                      variant={variant} 
                      animation={animation}
                      className="mx-auto"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Cards comparison skeleton
function CardsComparisonSkeleton({
  itemCount,
  variant = 'default',
  animation = 'pulse'
}: ComparisonItemSkeletonProps) {
  return (
    <div className="space-y-6">
      {Array.from({ length: 6 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="border rounded-lg bg-card p-6">
          <div className="mb-4">
            <SkeletonTitle
              width="40%"
              variant={variant}
              animation={animation}
            />
          </div>

          <div className={cn(
            'grid gap-4',
            itemCount === 2 ? 'grid-cols-1 md:grid-cols-2' :
            itemCount === 3 ? 'grid-cols-1 md:grid-cols-3' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          )}>
            {Array.from({ length: itemCount }).map((_, index) => (
              <div key={index} className="p-4 border rounded-lg bg-muted/20">
                <div className="text-center space-y-2">
                  <SkeletonText
                    width="60%"
                    variant={variant}
                    animation={animation}
                    className="mx-auto"
                  />
                  <SkeletonTitle
                    width="50%"
                    variant={variant}
                    animation={animation}
                    className="mx-auto"
                  />
                  <SkeletonText
                    width="40%"
                    height="0.875rem"
                    variant={variant}
                    animation={animation}
                    className="mx-auto"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Comparison chart skeleton
interface ComparisonChartSkeletonProps {
  title: string
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
}

function ComparisonChartSkeleton({
  title,
  variant = 'default',
  animation = 'pulse'
}: ComparisonChartSkeletonProps) {
  return (
    <div className="p-6 border rounded-lg bg-card space-y-4">
      <SkeletonTitle
        width="60%"
        variant={variant}
        animation={animation}
      />

      {/* Chart area */}
      <div className="h-80 space-y-3">
        {/* Bar chart placeholder */}
        <div className="h-64 flex items-end justify-around gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex-1 space-y-2">
              <Skeleton
                height={`${120 + (index * 20)}px`}
                width="100%"
                variant={variant}
                animation={animation}
              />
              <SkeletonText
                width="100%"
                height="0.75rem"
                variant={variant}
                animation={animation}
              />
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton
                width="12px"
                height="12px"
                borderRadius="0.25rem"
                variant={variant}
                animation={animation}
              />
              <SkeletonText
                width={`${50 + (index * 15)}px`}
                height="0.875rem"
                variant={variant}
                animation={animation}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Specialized comparison skeletons
export function JobComparisonSkeleton(props: Omit<ComparisonSkeletonProps, 'layout'>) {
  return <ComparisonSkeleton {...props} layout="side-by-side" />
}

export function SalaryComparisonSkeleton(props: Omit<ComparisonSkeletonProps, 'layout'>) {
  return <ComparisonSkeleton {...props} layout="table" />
}

export function BenefitsComparisonSkeleton(props: Omit<ComparisonSkeletonProps, 'layout'>) {
  return <ComparisonSkeleton {...props} layout="cards" />
}
import * as React from 'react'
import { cn } from '@/lib/utils'
import { 
  Skeleton, 
  SkeletonText, 
  SkeletonTitle, 
  SkeletonButton 
} from '@locumtruerate/ui'

interface CalculatorResultsSkeletonProps {
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
  type?: 'contract' | 'paycheck' | 'comparison'
  showBreakdown?: boolean
  showCharts?: boolean
  className?: string
}

export function CalculatorResultsSkeleton({
  variant = 'default',
  animation = 'pulse',
  type = 'contract',
  showBreakdown = true,
  showCharts = true,
  className
}: CalculatorResultsSkeletonProps) {
  return (
    <div 
      className={cn('w-full space-y-8', className)}
      role="status"
      aria-label={`Loading ${type} calculator results`}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <SkeletonTitle
          width="50%"
          height="2rem"
          variant={variant}
          animation={animation}
          className="mx-auto"
        />
        <SkeletonText
          width="70%"
          variant={variant}
          animation={animation}
          className="mx-auto"
        />
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: type === 'comparison' ? 6 : 3 }).map((_, index) => (
              <SummaryCardSkeleton
                key={index}
                variant={variant}
                animation={animation}
                isPrimary={index === 0}
              />
            ))}
          </div>

          {/* Detailed Breakdown */}
          {showBreakdown && (
            <BreakdownSkeleton
              type={type}
              variant={variant}
              animation={animation}
            />
          )}

          {/* Charts */}
          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton
                title="Tax Breakdown"
                variant={variant}
                animation={animation}
              />
              <ChartSkeleton
                title={type === 'contract' ? 'Earnings Timeline' : 'Deductions Breakdown'}
                variant={variant}
                animation={animation}
              />
            </div>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <ActionsPanelSkeleton
            variant={variant}
            animation={animation}
          />
          
          <RecommendationsSkeleton
            variant={variant}
            animation={animation}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
        <SkeletonButton
          size="lg"
          width="180px"
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

// Summary card skeleton
interface SummaryCardSkeletonProps {
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
  isPrimary?: boolean
}

function SummaryCardSkeleton({
  variant = 'default',
  animation = 'pulse',
  isPrimary = false
}: SummaryCardSkeletonProps) {
  return (
    <div className={cn(
      'p-6 border rounded-lg bg-card space-y-3',
      isPrimary && 'border-primary bg-primary/5'
    )}>
      <div className="flex items-center justify-between">
        <SkeletonText
          width="60%"
          variant={variant}
          animation={animation}
        />
        <Skeleton
          width="24px"
          height="24px"
          variant={variant}
          animation={animation}
        />
      </div>
      
      <SkeletonTitle
        width="80%"
        height="2rem"
        variant={variant}
        animation={animation}
      />
      
      <div className="flex items-center gap-2">
        <Skeleton
          width="16px"
          height="16px"
          variant={variant}
          animation={animation}
        />
        <SkeletonText
          width="50%"
          variant={variant}
          animation={animation}
        />
      </div>
    </div>
  )
}

// Breakdown table skeleton
interface BreakdownSkeletonProps {
  type: 'contract' | 'paycheck' | 'comparison'
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
}

function BreakdownSkeleton({
  type,
  variant = 'default',
  animation = 'pulse'
}: BreakdownSkeletonProps) {
  const rows = type === 'contract' ? 8 : type === 'paycheck' ? 10 : 12

  return (
    <div className="border rounded-lg bg-card">
      <div className="p-6 border-b">
        <SkeletonTitle
          width="40%"
          variant={variant}
          animation={animation}
        />
      </div>
      
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-4 flex justify-between items-center">
            <div className="space-y-1">
              <SkeletonText
                width={`${120 + (index * 10)}px`}
                variant={variant}
                animation={animation}
              />
              {index % 3 === 0 && (
                <SkeletonText
                  width="80px"
                  height="0.75rem"
                  variant={variant}
                  animation={animation}
                />
              )}
            </div>
            
            <div className="text-right space-y-1">
              <SkeletonText
                width="80px"
                variant={variant}
                animation={animation}
              />
              {index % 4 === 0 && (
                <SkeletonText
                  width="60px"
                  height="0.75rem"
                  variant={variant}
                  animation={animation}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-muted/20 border-t">
        <div className="flex justify-between items-center">
          <SkeletonTitle
            width="30%"
            variant={variant}
            animation={animation}
          />
          <SkeletonTitle
            width="25%"
            variant={variant}
            animation={animation}
          />
        </div>
      </div>
    </div>
  )
}

// Chart skeleton
interface ChartSkeletonProps {
  title: string
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
}

function ChartSkeleton({
  title,
  variant = 'default',
  animation = 'pulse'
}: ChartSkeletonProps) {
  return (
    <div className="p-6 border rounded-lg bg-card space-y-4">
      <SkeletonTitle
        width="60%"
        variant={variant}
        animation={animation}
      />
      
      {/* Chart area */}
      <div className="h-64 space-y-2">
        {/* Chart placeholder */}
        <Skeleton
          height="200px"
          width="100%"
          borderRadius="0.5rem"
          variant={variant}
          animation={animation}
        />
        
        {/* Legend */}
        <div className="flex justify-center gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton
                width="12px"
                height="12px"
                borderRadius="50%"
                variant={variant}
                animation={animation}
              />
              <SkeletonText
                width={`${60 + (index * 10)}px`}
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

// Actions panel skeleton
function ActionsPanelSkeleton({
  variant = 'default',
  animation = 'pulse'
}: Pick<CalculatorResultsSkeletonProps, 'variant' | 'animation'>) {
  return (
    <div className="p-6 border rounded-lg bg-card space-y-4">
      <SkeletonTitle
        width="50%"
        variant={variant}
        animation={animation}
      />
      
      <div className="space-y-3">
        <SkeletonButton
          size="lg"
          width="100%"
          variant={variant}
          animation={animation}
        />
        <SkeletonButton
          size="md"
          width="100%"
          variant={variant}
          animation={animation}
        />
        <SkeletonButton
          size="md"
          width="100%"
          variant={variant}
          animation={animation}
        />
      </div>
      
      <div className="pt-3 border-t space-y-2">
        <SkeletonText
          width="40%"
          variant={variant}
          animation={animation}
        />
        <div className="flex gap-2">
          <Skeleton
            width="32px"
            height="32px"
            borderRadius="50%"
            variant={variant}
            animation={animation}
          />
          <Skeleton
            width="32px"
            height="32px"
            borderRadius="50%"
            variant={variant}
            animation={animation}
          />
          <Skeleton
            width="32px"
            height="32px"
            borderRadius="50%"
            variant={variant}
            animation={animation}
          />
        </div>
      </div>
    </div>
  )
}

// Recommendations skeleton
function RecommendationsSkeleton({
  variant = 'default',
  animation = 'pulse'
}: Pick<CalculatorResultsSkeletonProps, 'variant' | 'animation'>) {
  return (
    <div className="p-6 border rounded-lg bg-muted/20 space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton
          width="20px"
          height="20px"
          variant={variant}
          animation={animation}
        />
        <SkeletonTitle
          width="60%"
          variant={variant}
          animation={animation}
        />
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonText
              width="90%"
              variant={variant}
              animation={animation}
            />
            <SkeletonText
              width="70%"
              height="0.875rem"
              variant={variant}
              animation={animation}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Specialized calculator results skeletons
export function ContractCalculatorResultsSkeleton(props: Omit<CalculatorResultsSkeletonProps, 'type'>) {
  return <CalculatorResultsSkeleton {...props} type="contract" />
}

export function PaycheckCalculatorResultsSkeleton(props: Omit<CalculatorResultsSkeletonProps, 'type'>) {
  return <CalculatorResultsSkeleton {...props} type="paycheck" />
}

export function ComparisonCalculatorResultsSkeleton(props: Omit<CalculatorResultsSkeletonProps, 'type'>) {
  return <CalculatorResultsSkeleton {...props} type="comparison" />
}
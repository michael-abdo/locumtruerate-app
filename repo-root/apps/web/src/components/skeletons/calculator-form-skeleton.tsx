import * as React from 'react'
import { cn } from '@/lib/utils'
import { 
  Skeleton, 
  SkeletonText, 
  SkeletonTitle, 
  SkeletonButton,
  FormFieldSkeleton,
  FormSkeleton
} from '@locumtruerate/ui'

interface CalculatorFormSkeletonProps {
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
  type?: 'contract' | 'paycheck' | 'comparison'
  showAdvanced?: boolean
  className?: string
}

export function CalculatorFormSkeleton({
  variant = 'default',
  animation = 'pulse',
  type = 'contract',
  showAdvanced = false,
  className
}: CalculatorFormSkeletonProps) {
  return (
    <div 
      className={cn('w-full max-w-4xl mx-auto space-y-8', className)}
      role="status"
      aria-label={`Loading ${type} calculator form`}
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

      {/* Form sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - Form inputs */}
        <div className="space-y-6">
          {/* Basic Information Section */}
          <CalculatorSectionSkeleton
            title="Basic Information"
            fields={type === 'contract' ? 
              ['Job Title', 'Specialty', 'Contract Type'] : 
              ['Gross Salary', 'Pay Period', 'Pay Date']
            }
            variant={variant}
            animation={animation}
          />

          {/* Location Section */}
          <CalculatorSectionSkeleton
            title="Location"
            fields={type === 'contract' ? 
              ['State', 'City', 'ZIP Code'] : 
              ['Work State', 'Residence State', 'City', 'ZIP Code']
            }
            variant={variant}
            animation={animation}
          />

          {/* Contract/Tax Terms Section */}
          <CalculatorSectionSkeleton
            title={type === 'contract' ? 'Contract Terms' : 'Tax Information'}
            fields={type === 'contract' ? 
              ['Hourly Rate', 'Hours per Week', 'Duration', 'Start Date', 'End Date'] :
              ['Filing Status', 'Allowances', 'Additional Exemptions']
            }
            variant={variant}
            animation={animation}
          />

          {/* Advanced/Optional Section */}
          {showAdvanced && (
            <CalculatorSectionSkeleton
              title={type === 'contract' ? 'Expenses (Optional)' : 'Deductions (Optional)'}
              fields={type === 'contract' ? 
                ['Travel Expenses', 'Housing Allowance', 'Malpractice Insurance'] :
                ['401k Contribution', 'Health Insurance', 'Other Deductions']
              }
              variant={variant}
              animation={animation}
              isExpanded={false}
            />
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <SkeletonButton
              size="lg"
              width="100%"
              variant={variant}
              animation={animation}
            />
            <SkeletonButton
              size="lg"
              width="120px"
              variant={variant}
              animation={animation}
            />
            <SkeletonButton
              size="lg"
              width="100px"
              variant={variant}
              animation={animation}
            />
          </div>
        </div>

        {/* Right column - Quick preview/results */}
        <div className="space-y-6">
          <CalculatorPreviewSkeleton
            type={type}
            variant={variant}
            animation={animation}
          />
        </div>
      </div>
    </div>
  )
}

// Calculator section skeleton
interface CalculatorSectionSkeletonProps {
  title: string
  fields: string[]
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
  isExpanded?: boolean
}

function CalculatorSectionSkeleton({
  title,
  fields,
  variant = 'default',
  animation = 'pulse',
  isExpanded = true
}: CalculatorSectionSkeletonProps) {
  return (
    <div className="space-y-4 p-6 border rounded-lg bg-card">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <SkeletonTitle
          width="60%"
          height="1.5rem"
          variant={variant}
          animation={animation}
        />
        {!isExpanded && (
          <Skeleton
            width="24px"
            height="24px"
            variant={variant}
            animation={animation}
          />
        )}
      </div>

      {/* Fields */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field, index) => (
            <FormFieldSkeleton
              key={field}
              fieldType={
                field.toLowerCase().includes('date') ? 'input' :
                field.toLowerCase().includes('type') || field.toLowerCase().includes('status') || field.toLowerCase().includes('period') ? 'select' :
                'input'
              }
              variant={variant}
              animation={animation}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Calculator preview skeleton (for right column)
interface CalculatorPreviewSkeletonProps {
  type: 'contract' | 'paycheck' | 'comparison'
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
}

function CalculatorPreviewSkeleton({
  type,
  variant = 'default',
  animation = 'pulse'
}: CalculatorPreviewSkeletonProps) {
  return (
    <div className="sticky top-6 space-y-6">
      {/* Quick Summary Card */}
      <div className="p-6 border rounded-lg bg-card space-y-4">
        <SkeletonTitle
          width="50%"
          variant={variant}
          animation={animation}
        />
        
        <div className="space-y-3">
          {type === 'contract' ? (
            <>
              <div className="flex justify-between items-center">
                <SkeletonText width="60%" variant={variant} animation={animation} />
                <SkeletonText width="30%" variant={variant} animation={animation} />
              </div>
              <div className="flex justify-between items-center">
                <SkeletonText width="50%" variant={variant} animation={animation} />
                <SkeletonText width="40%" variant={variant} animation={animation} />
              </div>
              <div className="flex justify-between items-center">
                <SkeletonText width="70%" variant={variant} animation={animation} />
                <SkeletonText width="35%" variant={variant} animation={animation} />
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <SkeletonText width="50%" variant={variant} animation={animation} />
                <SkeletonText width="40%" variant={variant} animation={animation} />
              </div>
              <div className="flex justify-between items-center">
                <SkeletonText width="60%" variant={variant} animation={animation} />
                <SkeletonText width="30%" variant={variant} animation={animation} />
              </div>
              <div className="flex justify-between items-center">
                <SkeletonText width="40%" variant={variant} animation={animation} />
                <SkeletonText width="35%" variant={variant} animation={animation} />
              </div>
            </>
          )}
        </div>

        <div className="pt-3 border-t">
          <div className="flex justify-between items-center">
            <SkeletonText width="40%" variant={variant} animation={animation} />
            <SkeletonTitle width="30%" variant={variant} animation={animation} />
          </div>
        </div>
      </div>

      {/* Tips & Information */}
      <div className="p-6 border rounded-lg bg-muted/20 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton
            width="20px"
            height="20px"
            variant={variant}
            animation={animation}
          />
          <SkeletonText width="30%" variant={variant} animation={animation} />
        </div>
        
        <div className="space-y-2">
          <SkeletonText width="100%" variant={variant} animation={animation} />
          <SkeletonText width="90%" variant={variant} animation={animation} />
          <SkeletonText width="80%" variant={variant} animation={animation} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <SkeletonButton
          size="lg"
          width="100%"
          variant={variant}
          animation={animation}
        />
        <div className="flex gap-2">
          <SkeletonButton
            size="md"
            width="50%"
            variant={variant}
            animation={animation}
          />
          <SkeletonButton
            size="md"
            width="50%"
            variant={variant}
            animation={animation}
          />
        </div>
      </div>
    </div>
  )
}

// Specialized calculator form skeletons
export function ContractCalculatorFormSkeleton(props: Omit<CalculatorFormSkeletonProps, 'type'>) {
  return <CalculatorFormSkeleton {...props} type="contract" />
}

export function PaycheckCalculatorFormSkeleton(props: Omit<CalculatorFormSkeletonProps, 'type'>) {
  return <CalculatorFormSkeleton {...props} type="paycheck" />
}

export function ComparisonCalculatorFormSkeleton(props: Omit<CalculatorFormSkeletonProps, 'type'>) {
  return <CalculatorFormSkeleton {...props} type="comparison" />
}

// Simple calculator loading state
export function SimpleCalculatorSkeleton({
  variant = 'default',
  animation = 'pulse'
}: Pick<CalculatorFormSkeletonProps, 'variant' | 'animation'>) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6">
      <div className="text-center space-y-2">
        <SkeletonTitle width="60%" variant={variant} animation={animation} className="mx-auto" />
        <SkeletonText width="80%" variant={variant} animation={animation} className="mx-auto" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <FormFieldSkeleton
            key={index}
            fieldType={index % 3 === 0 ? 'select' : 'input'}
            variant={variant}
            animation={animation}
          />
        ))}
      </div>

      <SkeletonButton
        size="lg"
        width="100%"
        variant={variant}
        animation={animation}
      />
    </div>
  )
}
import * as React from 'react'
import { cn } from '../../utils'
import { Skeleton, SkeletonProps, SkeletonText, SkeletonButton } from './skeleton'

interface FormFieldSkeletonProps extends Omit<SkeletonProps, 'height' | 'width'> {
  label?: boolean
  required?: boolean
  helpText?: boolean
  error?: boolean
  fieldType?: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio'
}

const FormFieldSkeleton = React.forwardRef<HTMLDivElement, FormFieldSkeletonProps>(
  ({
    className,
    label = true,
    required = false,
    helpText = false,
    error = false,
    fieldType = 'input',
    variant = 'default',
    animation = 'pulse',
    ...props
  }, ref) => {
    const getFieldHeight = () => {
      switch (fieldType) {
        case 'textarea':
          return '80px'
        case 'select':
          return '44px'
        case 'checkbox':
        case 'radio':
          return '20px'
        default:
          return '44px'
      }
    }

    const getFieldWidth = () => {
      switch (fieldType) {
        case 'checkbox':
        case 'radio':
          return '20px'
        default:
          return '100%'
      }
    }

    return (
      <div
        ref={ref}
        className={cn('space-y-2', className)}
        role="status"
        aria-label="Loading form field"
        {...props}
      >
        {/* Label */}
        {label && (
          <div className="flex items-center space-x-1">
            <SkeletonText
              width="120px"
              variant={variant}
              animation={animation}
            />
            {required && (
              <Skeleton
                width="8px"
                height="12px"
                variant={variant}
                animation={animation}
              />
            )}
          </div>
        )}

        {/* Field */}
        <div className={cn(
          'flex items-center space-x-2',
          fieldType === 'checkbox' || fieldType === 'radio' ? '' : 'w-full'
        )}>
          <Skeleton
            height={getFieldHeight()}
            width={getFieldWidth()}
            borderRadius="0.375rem"
            variant={variant}
            animation={animation}
          />
          
          {/* Label for checkbox/radio */}
          {(fieldType === 'checkbox' || fieldType === 'radio') && label && (
            <SkeletonText
              width="100px"
              variant={variant}
              animation={animation}
            />
          )}
        </div>

        {/* Help text */}
        {helpText && (
          <SkeletonText
            width="80%"
            height="0.875rem"
            variant={variant}
            animation={animation}
          />
        )}

        {/* Error message */}
        {error && (
          <SkeletonText
            width="60%"
            height="0.875rem"
            variant={variant}
            animation={animation}
          />
        )}
      </div>
    )
  }
)
FormFieldSkeleton.displayName = 'FormFieldSkeleton'

interface FormSkeletonProps extends Omit<SkeletonProps, 'height' | 'width'> {
  fields?: number
  sections?: number
  showTitle?: boolean
  showButtons?: boolean
  buttonCount?: number
  layout?: 'vertical' | 'grid' | 'inline'
}

const FormSkeleton = React.forwardRef<HTMLDivElement, FormSkeletonProps>(
  ({
    className,
    fields = 5,
    sections = 1,
    showTitle = true,
    showButtons = true,
    buttonCount = 2,
    layout = 'vertical',
    variant = 'default',
    animation = 'pulse',
    ...props
  }, ref) => {
    const fieldsPerSection = Math.ceil(fields / sections)
    
    return (
      <div
        ref={ref}
        className={cn('w-full space-y-6', className)}
        role="status"
        aria-label="Loading form"
        {...props}
      >
        {/* Form Title */}
        {showTitle && (
          <div className="space-y-2">
            <Skeleton
              height="2rem"
              width="60%"
              variant={variant}
              animation={animation}
            />
            <SkeletonText
              width="80%"
              variant={variant}
              animation={animation}
            />
          </div>
        )}

        {/* Form Sections */}
        {Array.from({ length: sections }).map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            {/* Section Title (if multiple sections) */}
            {sections > 1 && (
              <Skeleton
                height="1.5rem"
                width="40%"
                variant={variant}
                animation={animation}
              />
            )}

            {/* Fields */}
            <div className={cn(
              layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' :
              layout === 'inline' ? 'flex flex-wrap gap-4' :
              'space-y-4'
            )}>
              {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => {
                const globalIndex = sectionIndex * fieldsPerSection + fieldIndex
                if (globalIndex >= fields) return null

                // Vary field types for realism
                const fieldTypes: FormFieldSkeletonProps['fieldType'][] = ['input', 'textarea', 'select', 'checkbox']
                const fieldType = fieldTypes[globalIndex % fieldTypes.length]

                return (
                  <FormFieldSkeleton
                    key={`${sectionIndex}-${fieldIndex}`}
                    fieldType={fieldType}
                    required={globalIndex % 3 === 0}
                    helpText={globalIndex % 4 === 0}
                    variant={variant}
                    animation={animation}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {/* Form Buttons */}
        {showButtons && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {Array.from({ length: buttonCount }).map((_, index) => (
              <SkeletonButton
                key={index}
                size="lg"
                width={index === 0 ? '120px' : '100px'}
                variant={variant}
                animation={animation}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
)
FormSkeleton.displayName = 'FormSkeleton'

// Specialized form skeleton variants
const LoginFormSkeleton = React.forwardRef<HTMLDivElement, Omit<FormSkeletonProps, 'fields' | 'buttonCount'>>((props, ref) => (
  <FormSkeleton 
    ref={ref} 
    fields={2}
    sections={1}
    buttonCount={1}
    showTitle={true}
    {...props} 
  />
))
LoginFormSkeleton.displayName = 'LoginFormSkeleton'

const ProfileFormSkeleton = React.forwardRef<HTMLDivElement, Omit<FormSkeletonProps, 'fields' | 'sections'>>((props, ref) => (
  <FormSkeleton 
    ref={ref} 
    fields={8}
    sections={2}
    layout="grid"
    {...props} 
  />
))
ProfileFormSkeleton.displayName = 'ProfileFormSkeleton'

const ContactFormSkeleton = React.forwardRef<HTMLDivElement, Omit<FormSkeletonProps, 'fields' | 'buttonCount'>>((props, ref) => (
  <FormSkeleton 
    ref={ref} 
    fields={4}
    sections={1}
    buttonCount={2}
    {...props} 
  />
))
ContactFormSkeleton.displayName = 'ContactFormSkeleton'

const SettingsFormSkeleton = React.forwardRef<HTMLDivElement, Omit<FormSkeletonProps, 'fields' | 'sections' | 'layout'>>((props, ref) => (
  <FormSkeleton 
    ref={ref} 
    fields={12}
    sections={3}
    layout="vertical"
    {...props} 
  />
))
SettingsFormSkeleton.displayName = 'SettingsFormSkeleton'

export {
  FormFieldSkeleton,
  FormSkeleton,
  LoginFormSkeleton,
  ProfileFormSkeleton,
  ContactFormSkeleton,
  SettingsFormSkeleton,
}
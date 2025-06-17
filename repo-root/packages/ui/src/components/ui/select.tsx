import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Option {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: Option[]
  value?: string
  defaultValue?: string
  placeholder?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: string
  label?: string
  description?: string
  required?: boolean
  className?: string
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({
    options,
    value,
    defaultValue,
    placeholder = 'Select an option',
    onChange,
    disabled = false,
    error,
    label,
    description,
    required = false,
    className,
    id,
    ...ariaProps
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || '')
    const [focusedIndex, setFocusedIndex] = React.useState(-1)
    
    const selectRef = React.useRef<HTMLButtonElement>(null)
    const listboxRef = React.useRef<HTMLUListElement>(null)
    const optionRefs = React.useRef<(HTMLLIElement | null)[]>([])
    
    const selectId = id || React.useId()
    const listboxId = `${selectId}-listbox`
    const errorId = error ? `${selectId}-error` : undefined
    const descriptionId = description ? `${selectId}-description` : undefined

    // Combine ref
    React.useImperativeHandle(ref, () => selectRef.current!)

    // Update internal state when value prop changes
    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value)
      }
    }, [value])

    // Build aria-describedby
    const ariaDescribedBy = [
      ariaProps['aria-describedby'],
      errorId,
      descriptionId,
    ].filter(Boolean).join(' ') || undefined

    const selectedOption = options.find(option => option.value === selectedValue)

    const handleToggle = () => {
      if (disabled) return
      setIsOpen(!isOpen)
      setFocusedIndex(selectedValue ? options.findIndex(opt => opt.value === selectedValue) : 0)
    }

    const handleSelect = (option: Option) => {
      if (option.disabled) return
      
      setSelectedValue(option.value)
      setIsOpen(false)
      onChange?.(option.value)
      
      // Return focus to the trigger
      selectRef.current?.focus()
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (isOpen && focusedIndex >= 0) {
            handleSelect(options[focusedIndex])
          } else {
            setIsOpen(true)
            setFocusedIndex(selectedValue ? options.findIndex(opt => opt.value === selectedValue) : 0)
          }
          break
          
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          selectRef.current?.focus()
          break
          
        case 'ArrowDown':
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
            setFocusedIndex(0)
          } else {
            const nextIndex = Math.min(focusedIndex + 1, options.length - 1)
            setFocusedIndex(nextIndex)
            optionRefs.current[nextIndex]?.scrollIntoView({ block: 'nearest' })
          }
          break
          
        case 'ArrowUp':
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
            setFocusedIndex(options.length - 1)
          } else {
            const prevIndex = Math.max(focusedIndex - 1, 0)
            setFocusedIndex(prevIndex)
            optionRefs.current[prevIndex]?.scrollIntoView({ block: 'nearest' })
          }
          break
          
        case 'Home':
          event.preventDefault()
          if (isOpen) {
            setFocusedIndex(0)
            optionRefs.current[0]?.scrollIntoView({ block: 'nearest' })
          }
          break
          
        case 'End':
          event.preventDefault()
          if (isOpen) {
            const lastIndex = options.length - 1
            setFocusedIndex(lastIndex)
            optionRefs.current[lastIndex]?.scrollIntoView({ block: 'nearest' })
          }
          break
      }
    }

    // Close on outside click
    React.useEffect(() => {
      if (!isOpen) return

      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        <div className="relative">
          <button
            ref={selectRef}
            id={selectId}
            type="button"
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive focus:ring-destructive',
              className
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-describedby={ariaDescribedBy}
            aria-invalid={error ? true : undefined}
            aria-required={required}
            aria-label={ariaProps['aria-label'] || (label && !ariaProps['aria-labelledby'] ? label : undefined)}
            aria-labelledby={ariaProps['aria-labelledby']}
            disabled={disabled}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
          >
            <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown 
              className={cn(
                'h-4 w-4 transition-transform',
                isOpen && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </button>

          {isOpen && (
            <ul
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              aria-label={label || ariaProps['aria-label']}
              className={cn(
                'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md',
                'animate-in fade-in-0 zoom-in-95'
              )}
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  ref={el => optionRefs.current[index] = el}
                  role="option"
                  aria-selected={option.value === selectedValue}
                  aria-disabled={option.disabled}
                  className={cn(
                    'relative flex cursor-default select-none items-center py-2 pl-8 pr-2 text-sm outline-none',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground',
                    focusedIndex === index && 'bg-accent text-accent-foreground',
                    option.disabled && 'pointer-events-none opacity-50'
                  )}
                  onClick={() => handleSelect(option)}
                >
                  {option.value === selectedValue && (
                    <Check className="absolute left-2 h-4 w-4" aria-hidden="true" />
                  )}
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select, type Option as SelectOption }
import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  initialFocus?: React.RefObject<HTMLElement>
  returnFocus?: React.RefObject<HTMLElement>
}

interface ModalContextType {
  onClose: () => void
  titleId: string
  descriptionId: string
}

const ModalContext = React.createContext<ModalContextType | null>(null)

const useModal = () => {
  const context = React.useContext(ModalContext)
  if (!context) {
    throw new Error('Modal components must be used within a Modal')
  }
  return context
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocus,
  returnFocus,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null)
  const backdropRef = React.useRef<HTMLDivElement>(null)
  const previousActiveElement = React.useRef<HTMLElement | null>(null)
  
  const titleId = React.useId()
  const descriptionId = React.useId()

  // Size variants
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  }

  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [closeOnEscape, isOpen, onClose])

  // Focus management
  React.useEffect(() => {
    if (!isOpen) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Focus the modal or initial focus element
    const focusElement = initialFocus?.current || modalRef.current
    if (focusElement) {
      // Use setTimeout to ensure the modal is rendered
      setTimeout(() => {
        focusElement.focus()
      }, 0)
    }

    // Return focus when modal closes
    return () => {
      const elementToFocus = returnFocus?.current || previousActiveElement.current
      if (elementToFocus && document.contains(elementToFocus)) {
        elementToFocus.focus()
      }
    }
  }, [isOpen, initialFocus, returnFocus])

  // Focus trap
  React.useEffect(() => {
    if (!isOpen) return

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (!firstElement) return

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === backdropRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <ModalContext.Provider value={{ onClose, titleId, descriptionId }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          ref={backdropRef}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
        
        {/* Modal */}
        <div
          ref={modalRef}
          className={cn(
            'relative bg-background rounded-lg shadow-lg max-h-[90vh] overflow-auto',
            sizeClasses[size],
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  )
}

const ModalHeader: React.FC<{
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}> = ({ children, className, showCloseButton = true }) => {
  const { onClose } = useModal()

  return (
    <div className={cn('flex items-center justify-between p-6 pb-4', className)}>
      <div className="flex-1">
        {children}
      </div>
      {showCloseButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-full"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

const ModalTitle: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  const { titleId } = useModal()

  return (
    <h2
      id={titleId}
      className={cn('text-lg font-semibold text-foreground', className)}
    >
      {children}
    </h2>
  )
}

const ModalDescription: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  const { descriptionId } = useModal()

  return (
    <p
      id={descriptionId}
      className={cn('text-sm text-muted-foreground mt-2', className)}
    >
      {children}
    </p>
  )
}

const ModalBody: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
)

const ModalFooter: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('flex items-center justify-end gap-2 p-6 pt-4 border-t', className)}>
    {children}
  </div>
)

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  useModal
}
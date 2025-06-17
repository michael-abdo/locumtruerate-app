import * as React from 'react'
import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Button } from './button'

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive: 'destructive border-destructive bg-destructive text-destructive-foreground',
        success: 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50',
        warning: 'border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  title?: string
  description?: string
  action?: React.ReactNode
  onClose?: () => void
  duration?: number
  persistent?: boolean
}

interface ToastContextType {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id'>) => string
  removeToast: (id: string) => void
  removeAllToasts: () => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastWithId extends ToastProps {
  id: string
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastWithId[]>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastWithId = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration (default 5 seconds)
    if (!toast.persistent) {
      const duration = toast.duration || 5000
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const removeAllToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, removeAllToasts }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  )
}

const ToastViewport: React.FC = () => {
  const { toasts } = useToast()

  return (
    <div
      className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}

const Toast = React.forwardRef<HTMLDivElement, ToastWithId>(
  ({ className, variant, title, description, action, onClose, id, ...props }, ref) => {
    const { removeToast } = useToast()
    const toastRef = React.useRef<HTMLDivElement>(null)

    // Combine refs
    React.useImperativeHandle(ref, () => toastRef.current!)

    const handleClose = () => {
      onClose?.()
      removeToast(id)
    }

    // Focus management for accessibility
    React.useEffect(() => {
      if (toastRef.current) {
        toastRef.current.focus()
      }
    }, [])

    // Handle escape key
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    return (
      <div
        ref={toastRef}
        className={cn(toastVariants({ variant }), className)}
        tabIndex={-1}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        onKeyDown={handleKeyDown}
        {...props}
      >
        <div className="grid gap-1">
          {title && (
            <div className="text-sm font-semibold">
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm opacity-90">
              {description}
            </div>
          )}
        </div>
        
        {action && (
          <div className="flex items-center gap-2">
            {action}
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 rounded-md opacity-60 hover:opacity-100"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }
)

Toast.displayName = 'Toast'

// Helper functions for common toast types
export const toast = {
  success: (message: string, options?: Partial<ToastProps>) => {
    const { addToast } = useToast()
    return addToast({
      variant: 'success',
      title: 'Success',
      description: message,
      ...options,
    })
  },
  
  error: (message: string, options?: Partial<ToastProps>) => {
    const { addToast } = useToast()
    return addToast({
      variant: 'destructive',
      title: 'Error',
      description: message,
      ...options,
    })
  },
  
  warning: (message: string, options?: Partial<ToastProps>) => {
    const { addToast } = useToast()
    return addToast({
      variant: 'warning',
      title: 'Warning',
      description: message,
      ...options,
    })
  },
  
  info: (message: string, options?: Partial<ToastProps>) => {
    const { addToast } = useToast()
    return addToast({
      variant: 'default',
      title: 'Info',
      description: message,
      ...options,
    })
  },
}

export { Toast, toastVariants, ToastViewport }
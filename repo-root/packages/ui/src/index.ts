import * as React from 'react'

// Legacy web-only components (deprecated - use cross-platform versions)
export { Button as WebButton, buttonVariants as webButtonVariants } from './button'

// Cross-platform components (temporarily disabled due to React Native import issues)
// export * from './cross-platform'

// Export individual web-only components instead
export { Button, buttonVariants } from './components/ui/button'
export { Input } from './components/ui/input'
export { Select, type SelectOption } from './components/ui/select'

// Individual Select components (stub exports for compatibility)
export const SelectTrigger = ({ children, ...props }: any) => React.createElement('div', props, children)
export const SelectValue = ({ children, ...props }: any) => React.createElement('div', props, children)
export const SelectContent = ({ children, ...props }: any) => React.createElement('div', props, children)
export const SelectItem = ({ children, ...props }: any) => React.createElement('div', props, children)

// Table components (stub exports for compatibility)
export const Table = ({ children, ...props }: any) => React.createElement('table', props, children)
export const TableHeader = ({ children, ...props }: any) => React.createElement('thead', props, children)
export const TableBody = ({ children, ...props }: any) => React.createElement('tbody', props, children)
export const TableRow = ({ children, ...props }: any) => React.createElement('tr', props, children)
export const TableHead = ({ children, ...props }: any) => React.createElement('th', props, children)
export const TableCell = ({ children, ...props }: any) => React.createElement('td', props, children)

// Progress component (stub export for compatibility)
export const Progress = ({ children, ...props }: any) => React.createElement('div', props, children)
export { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from './components/ui/modal'
export { Toast, toast } from './components/ui/toast'
export { Badge, badgeVariants } from './components/ui/badge'
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/ui/card'
export { Label } from './components/ui/label'
export { Textarea } from './components/ui/textarea'
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'

// Utilities
export { cn } from './lib/utils'
export * from './lib/skeleton-utils'

// Base skeleton components
export {
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  skeletonVariants,
} from './components/ui/skeleton'

// Common skeleton patterns
export {
  CardSkeleton,
  ProfileCardSkeleton,
  ArticleCardSkeleton,
  StatCardSkeleton,
} from './components/ui/card-skeleton'

export {
  ListSkeleton,
  SearchResultsSkeleton,
  UserListSkeleton,
  NotificationListSkeleton,
  SimpleListSkeleton,
} from './components/ui/list-skeleton'

export {
  FormFieldSkeleton,
  FormSkeleton,
  LoginFormSkeleton,
  ProfileFormSkeleton,
  ContactFormSkeleton,
  SettingsFormSkeleton,
} from './components/ui/form-skeleton'

export {
  TableSkeleton,
  UserTableSkeleton,
  JobTableSkeleton,
  AnalyticsTableSkeleton,
  SimpleTableSkeleton,
} from './components/ui/table-skeleton'

export {
  TextSkeleton,
  ParagraphSkeleton,
  HeadingSkeleton,
  CaptionSkeleton,
  CodeBlockSkeleton,
  QuoteSkeleton,
  ArticleSkeleton,
} from './components/ui/text-skeleton'

// Support components
export {
  SupportWidget,
  FloatingSupportButton,
  SupportDashboard,
} from './components/support'
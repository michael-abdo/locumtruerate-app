// Legacy web-only components (deprecated - use cross-platform versions)
export { Button as WebButton, buttonVariants as webButtonVariants } from './button'

// Cross-platform components (temporarily disabled due to React Native import issues)
// export * from './cross-platform'

// Export individual web-only components instead
export { Button, buttonVariants } from './components/ui/button'
export { Input } from './components/ui/input'
export { Select, type SelectOption } from './components/ui/select'
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
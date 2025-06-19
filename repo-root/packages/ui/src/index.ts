// Legacy web-only components (deprecated - use cross-platform versions)
export { Button as WebButton, buttonVariants } from './button'

// Cross-platform components (recommended)
export * from './cross-platform'

// Utilities
export { cn } from './utils'
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
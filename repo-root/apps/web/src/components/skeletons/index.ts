// Job-specific skeletons
export {
  JobCardSkeleton,
  FeaturedJobCardSkeleton,
  CompactJobCardSkeleton,
} from './job-card-skeleton'

export {
  JobListSkeleton,
  JobSearchResultsSkeleton,
  SavedJobsSkeleton,
  JobCategorySkeleton,
  JobDashboardSkeleton,
} from './job-list-skeleton'

export {
  JobFiltersSkeleton,
  MobileFiltersModalSkeleton,
  QuickFiltersSkeleton,
  FilterChipsSkeleton,
} from './job-filters-skeleton'

// Calculator skeletons
export {
  CalculatorFormSkeleton,
  ContractCalculatorFormSkeleton,
  PaycheckCalculatorFormSkeleton,
  ComparisonCalculatorFormSkeleton,
  SimpleCalculatorSkeleton,
} from './calculator-form-skeleton'

export {
  CalculatorResultsSkeleton,
  ContractCalculatorResultsSkeleton,
  PaycheckCalculatorResultsSkeleton,
  ComparisonCalculatorResultsSkeleton,
} from './calculator-results-skeleton'

export {
  ComparisonSkeleton,
  JobComparisonSkeleton,
  SalaryComparisonSkeleton,
  BenefitsComparisonSkeleton,
} from './comparison-skeleton'

// Page-level skeletons
export { JobDetailPageSkeleton } from './job-detail-skeleton'

// Re-export common skeleton components from UI package for convenience
export {
  // Base components
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  
  // Common patterns
  CardSkeleton,
  ListSkeleton,
  FormSkeleton,
  TableSkeleton,
  TextSkeleton,
  
  // Utilities
  getRandomWidth,
  generateTextWidths,
  getSkeletonDimensions,
  createStaggeredDelays,
  getOptimizedSkeletonCount,
  generateSkeletonData,
  getAccessibleAnimation,
  getResponsiveSkeletonConfig,
  globalSkeletonState,
} from '@locumtruerate/ui'
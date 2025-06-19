# Skeleton Loading System

A comprehensive skeleton loading system for LocumTrueRate.com that provides smooth loading experiences across all devices and platforms.

## Overview

This skeleton system is designed with mobile-first architecture in mind, ensuring optimal performance and user experience across web, iOS, and Android platforms. All components follow the design patterns established in the existing codebase and support dark mode, accessibility features, and responsive layouts.

## Features

- 🎨 Multiple animation variants (pulse, shimmer, wave)
- 📱 Mobile-first responsive design
- ♿ Full accessibility support with screen readers
- 🌙 Dark mode compatibility
- ⚡ Performance-optimized for cross-platform deployment
- 🎛️ Highly configurable and composable
- 📊 Built-in loading state management
- 🕐 Intelligent delay handling to prevent loading flashes

## Base Components

### Skeleton
The core skeleton component with configurable variants and animations.

```tsx
import { Skeleton } from '@locumtruerate/ui'

<Skeleton 
  width="200px" 
  height="20px" 
  variant="shimmer" 
  animation="pulse" 
/>
```

### Pre-built Skeleton Elements

```tsx
import { 
  SkeletonText, 
  SkeletonTitle, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonCard 
} from '@locumtruerate/ui'

<SkeletonText width="80%" />
<SkeletonTitle width="60%" />
<SkeletonAvatar size="lg" />
<SkeletonButton size="md" width="120px" />
<SkeletonCard width="300px" height="200px" />
```

## Common Patterns

### Card Skeleton
For job cards, content cards, and profile cards.

```tsx
import { CardSkeleton, ProfileCardSkeleton } from '@locumtruerate/ui'

<CardSkeleton 
  showHeader={true}
  showFooter={true}
  showAvatar={false}
  headerLines={2}
  contentLines={3}
/>

<ProfileCardSkeleton />
```

### List Skeleton
For search results, user lists, and navigation items.

```tsx
import { ListSkeleton, SearchResultsSkeleton } from '@locumtruerate/ui'

<ListSkeleton 
  count={5}
  showAvatar={true}
  showBadge={true}
  orientation="vertical"
/>

<SearchResultsSkeleton count={8} />
```

### Form Skeleton
For forms and input layouts.

```tsx
import { FormSkeleton, LoginFormSkeleton } from '@locumtruerate/ui'

<FormSkeleton 
  fields={5}
  sections={2}
  layout="grid"
  showButtons={true}
/>

<LoginFormSkeleton />
```

### Table Skeleton
For data tables and admin interfaces.

```tsx
import { TableSkeleton, UserTableSkeleton } from '@locumtruerate/ui'

<TableSkeleton 
  rows={10}
  columns={5}
  showActions={true}
  showCheckbox={true}
/>

<UserTableSkeleton />
```

### Text Skeleton
For paragraphs, headings, and content blocks.

```tsx
import { TextSkeleton, ParagraphSkeleton, HeadingSkeleton } from '@locumtruerate/ui'

<TextSkeleton lines={3} spacing="normal" />
<ParagraphSkeleton />
<HeadingSkeleton level={1} width="70%" />
```

## Job-Specific Skeletons

### Job Card Skeleton
Matches the layout of the JobCard component.

```tsx
import { JobCardSkeleton, FeaturedJobCardSkeleton, CompactJobCardSkeleton } from '@/components/skeletons'

<JobCardSkeleton showExpanded={false} />
<FeaturedJobCardSkeleton />
<CompactJobCardSkeleton />
```

### Job List Skeleton
For job search results and listings.

```tsx
import { 
  JobListSkeleton, 
  JobSearchResultsSkeleton, 
  SavedJobsSkeleton 
} from '@/components/skeletons'

<JobListSkeleton 
  count={8}
  layout="grid"
  showFeatured={true}
  featuredCount={2}
/>

<JobSearchResultsSkeleton count={10} />
<SavedJobsSkeleton count={5} />
```

### Job Filters Skeleton
For filter sidebars and modals.

```tsx
import { 
  JobFiltersSkeleton, 
  MobileFiltersModalSkeleton, 
  QuickFiltersSkeleton 
} from '@/components/skeletons'

<JobFiltersSkeleton 
  layout="sidebar"
  showAppliedFilters={true}
/>

<MobileFiltersModalSkeleton />
<QuickFiltersSkeleton />
```

## Calculator Skeletons

### Calculator Form Skeleton
For calculator input forms.

```tsx
import { 
  CalculatorFormSkeleton, 
  ContractCalculatorFormSkeleton, 
  PaycheckCalculatorFormSkeleton 
} from '@/components/skeletons'

<CalculatorFormSkeleton 
  type="contract"
  showAdvanced={true}
/>

<ContractCalculatorFormSkeleton />
<PaycheckCalculatorFormSkeleton />
```

### Calculator Results Skeleton
For calculation results and breakdowns.

```tsx
import { 
  CalculatorResultsSkeleton, 
  ContractCalculatorResultsSkeleton 
} from '@/components/skeletons'

<CalculatorResultsSkeleton 
  type="contract"
  showBreakdown={true}
  showCharts={true}
/>

<ContractCalculatorResultsSkeleton />
```

### Comparison Skeleton
For side-by-side comparisons.

```tsx
import { 
  ComparisonSkeleton, 
  JobComparisonSkeleton, 
  SalaryComparisonSkeleton 
} from '@/components/skeletons'

<ComparisonSkeleton 
  itemCount={2}
  layout="side-by-side"
  showChart={true}
/>

<JobComparisonSkeleton itemCount={3} />
<SalaryComparisonSkeleton itemCount={2} />
```

## Loading Hooks

### useLoadingState
Manage complex loading states with minimum duration support.

```tsx
import { useLoadingState } from '@/hooks/loading'

const { 
  isLoading, 
  isSuccess, 
  isError, 
  execute, 
  reset 
} = useLoadingState({
  minimumLoadingTime: 500,
  resetDelay: 2000
})

// Execute async operation
await execute(async () => {
  return await fetchData()
})
```

### useSkeletonDelay
Prevent flash of loading states for quick operations.

```tsx
import { useSkeletonDelay } from '@/hooks/loading'

const { 
  showSkeleton, 
  isDelayed 
} = useSkeletonDelay(isLoading, {
  showDelay: 200,
  minimumDuration: 500
})

return showSkeleton ? <JobCardSkeleton /> : <JobCard data={data} />
```

### useProgressiveLoading
Manage multi-stage loading operations.

```tsx
import { useProgressiveLoading } from '@/hooks/loading'

const {
  stages,
  currentStage,
  progress,
  isComplete,
  setStageComplete
} = useProgressiveLoading([
  { id: 'auth', name: 'Authenticating' },
  { id: 'data', name: 'Loading Data' },
  { id: 'render', name: 'Rendering' }
])

// Update stage completion
setStageComplete('auth', true)
```

## Utilities

### getRandomWidth
Generate realistic text line widths.

```tsx
import { getRandomWidth, generateTextWidths } from '@locumtruerate/ui'

const width = getRandomWidth(60, 90) // "73%"
const widths = generateTextWidths(3) // ["85%", "92%", "67%"]
```

### getOptimizedSkeletonCount
Calculate optimal skeleton count for viewport.

```tsx
import { getOptimizedSkeletonCount } from '@locumtruerate/ui'

const count = getOptimizedSkeletonCount({
  viewportHeight: window.innerHeight,
  itemHeight: 120,
  buffer: 2
})
```

### globalSkeletonState
Global loading state management.

```tsx
import { globalSkeletonState } from '@locumtruerate/ui'

// Set loading state
globalSkeletonState.setLoading('jobs', true)

// Check if any component is loading
const isAnyLoading = globalSkeletonState.isAnyLoading()

// Subscribe to changes
const unsubscribe = globalSkeletonState.subscribe('jobs', (isLoading) => {
  console.log('Jobs loading state:', isLoading)
})
```

## Accessibility

All skeleton components include:

- Proper ARIA labels and roles
- Screen reader announcements
- Reduced motion support
- High contrast compatibility
- Keyboard navigation support

```tsx
<Skeleton 
  aria-label="Loading job information"
  role="status"
  aria-live="polite"
/>
```

## Performance Optimization

- Components use `React.memo` for optimal re-rendering
- CSS animations are GPU-accelerated
- Intersection Observer for viewport-based loading
- Automatic animation reduction for slow devices
- Optimized bundle splitting for mobile

## Mobile Considerations

- Touch-optimized minimum sizes (44px targets)
- Responsive breakpoints
- Reduced animation complexity on mobile
- Battery-efficient animations
- Cross-platform compatible styling

## Dark Mode Support

All skeleton components automatically adapt to dark mode using CSS custom properties and Tailwind's dark mode classes.

```tsx
// Automatically adapts to light/dark mode
<Skeleton className="bg-muted" />
```

## Animation Variants

### Pulse (Default)
Gentle opacity animation, best for general use.

### Shimmer
Gradient sweep animation, good for emphasizing loading.

### Wave
Horizontal wave animation, suitable for list items.

### None
No animation, for reduced motion preferences.

```tsx
<Skeleton variant="shimmer" animation="wave" />
```

## Best Practices

1. **Use appropriate skeleton types** - Match the skeleton to the content structure
2. **Respect user preferences** - Support reduced motion and high contrast
3. **Optimize for performance** - Use minimal animation on mobile devices
4. **Maintain consistency** - Use the same skeleton patterns across similar components
5. **Test across devices** - Ensure skeletons work on all target platforms

## Examples

### Basic Job Card Loading

```tsx
import { useSkeletonDelay } from '@/hooks/loading'
import { JobCardSkeleton } from '@/components/skeletons'

function JobCardWithLoading({ jobId }) {
  const [job, setJob] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const { showSkeleton } = useSkeletonDelay(isLoading)

  useEffect(() => {
    fetchJob(jobId).then(data => {
      setJob(data)
      setIsLoading(false)
    })
  }, [jobId])

  if (showSkeleton) {
    return <JobCardSkeleton />
  }

  return <JobCard job={job} />
}
```

### Progressive Calculator Loading

```tsx
import { useProgressiveLoading } from '@/hooks/loading'
import { CalculatorFormSkeleton } from '@/components/skeletons'

function CalculatorPage() {
  const {
    stages,
    currentStage,
    progress,
    isComplete,
    setStageComplete
  } = useProgressiveLoading([
    { id: 'form', name: 'Loading Form' },
    { id: 'data', name: 'Loading Data' },
    { id: 'calculations', name: 'Preparing Calculations' }
  ])

  if (!isComplete) {
    return (
      <div>
        <div className="mb-4">
          <div className="text-sm text-muted-foreground">
            {currentStage?.name} ({Math.round(progress)}%)
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <CalculatorFormSkeleton />
      </div>
    )
  }

  return <CalculatorForm />
}
```

## Contributing

When adding new skeleton components:

1. Follow the existing naming conventions
2. Include TypeScript types for all props
3. Add accessibility attributes
4. Support all animation variants
5. Include mobile-optimized styling
6. Add to the appropriate index files
7. Update this documentation

## Migration Guide

### From Basic Loading States

Replace simple loading states with skeleton components:

```tsx
// Before
{isLoading ? <div>Loading...</div> : <JobCard />}

// After
{isLoading ? <JobCardSkeleton /> : <JobCard />}
```

### From Custom Loaders

Replace custom loading components with skeleton patterns:

```tsx
// Before
<div className="animate-pulse bg-gray-200 h-4 w-full" />

// After
<SkeletonText width="100%" />
```

This skeleton system provides a foundation for smooth, accessible, and performant loading experiences across the entire LocumTrueRate.com platform.
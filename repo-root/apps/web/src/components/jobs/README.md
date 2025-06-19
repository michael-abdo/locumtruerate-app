# Job Components

This directory contains all job-related components for the LocumTrueRate platform.

## Components

### JobCard

A mobile-optimized job listing card component designed for cross-platform compatibility.

#### Features

- **Mobile-first responsive design**
  - Full width on mobile devices
  - Contained layout on desktop
  - Touch-friendly tap targets (minimum 44px)
  - Optimized for thumb reach

- **Key information display**
  - Job title and company
  - Location with remote status badge
  - Salary range with flexible formatting
  - Specialty and experience level
  - Posted date with relative formatting
  - Quick badges (urgent, featured)

- **Mobile-specific features**
  - Native share API integration
  - Save/favorite toggle with visual feedback
  - Quick apply button
  - Expandable description preview

- **Performance optimizations**
  - Lazy loading for images
  - Minimal re-renders using React hooks
  - Optimized for rendering in long lists

- **Accessibility**
  - Proper ARIA labels
  - Full keyboard navigation support
  - Screen reader optimized
  - Focus indicators

- **Cross-platform compatibility**
  - No web-only APIs (with fallbacks)
  - React Native compatible patterns
  - Clean separation of concerns

#### Usage

```tsx
import { JobCard } from '@/components/jobs'
import type { JobCardData } from '@locumtruerate/types'

function JobList() {
  const handleApply = (jobId: string) => {
    // Navigate to application form
  }
  
  const handleSave = (jobId: string, isSaved: boolean) => {
    // Update saved jobs
  }
  
  const handleShare = (jobId: string) => {
    // Custom share implementation (fallback)
  }
  
  return (
    <JobCard 
      job={jobData}
      onApply={handleApply}
      onSave={handleSave}
      onShare={handleShare}
      className="custom-class"
      isLoading={false}
    />
  )
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| job | JobCardData | Yes | Job data to display |
| onApply | (jobId: string) => void | No | Callback when apply button is clicked |
| onSave | (jobId: string, isSaved: boolean) => void | No | Callback when save button is toggled |
| onShare | (jobId: string) => void | No | Fallback callback when native share is not available |
| className | string | No | Additional CSS classes |
| isLoading | boolean | No | Show loading state |

#### Mobile Considerations

1. **Touch Targets**: All interactive elements have a minimum size of 44x44 pixels
2. **Swipe Gestures**: Component structure supports adding swipe gestures for actions
3. **Native Features**: Uses native share API when available
4. **Performance**: Optimized for 60fps scrolling in long lists

#### Cross-Platform Notes

- Component uses only cross-platform compatible APIs
- Styles use Tailwind classes that can be mapped to React Native styles
- Event handlers are abstracted for easy platform-specific implementations
- No direct DOM manipulation or browser-specific features

#### Testing

The component includes comprehensive tests covering:
- Rendering and display
- User interactions
- Accessibility
- Keyboard navigation
- Loading states
- Date formatting
- Mobile-specific features

Run tests with:
```bash
npm run test -- job-card.test.tsx
```

#### Future Enhancements

- Swipe gesture support for quick actions
- Skeleton loading states
- Animation transitions
- Offline support with local storage
- Advanced filtering badges

---

### JobFilters

A comprehensive, mobile-optimized job filtering component that provides advanced search and filtering capabilities for job listings.

#### Features

- **Mobile-first design**
  - Bottom sheet pattern on mobile devices
  - Sidebar layout on desktop
  - Touch-friendly controls with minimum 44px tap targets
  - Responsive design that adapts to screen size

- **Comprehensive filtering options**
  - Location search with autocomplete suggestions
  - Remote/On-site/Hybrid work arrangement filters
  - Medical specialty selection (20+ specialties)
  - Experience level filtering (Entry to Executive)
  - Job type selection (Full-time, Part-time, Contract, etc.)
  - Salary range with dual-input slider
  - Date posted filters (24h, 3d, 7d, 30d)
  - Company size categories
  - Benefits and perks multi-select
  - Quick filters for common searches

- **State management**
  - URL query parameter synchronization
  - Debounced updates (300ms) for performance
  - Filter persistence across page refreshes
  - Real-time filter counting and display

- **Performance optimizations**
  - Lazy loading for long option lists
  - Virtualization-ready architecture
  - Minimal re-renders using React hooks
  - Debounced search input handling

- **Accessibility features**
  - Full ARIA label support
  - Keyboard navigation for all controls
  - Screen reader optimized structure
  - High contrast mode support
  - Focus management and indicators

- **Cross-platform compatibility**
  - React Native compatible patterns
  - No web-only APIs (with fallbacks)
  - Shared TypeScript interfaces
  - Clean separation of concerns

#### Usage

```tsx
import { JobFilters, type JobFiltersState } from '@/components/jobs'

function JobSearchPage() {
  const [filters, setFilters] = useState<JobFiltersState>({})
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  const handleFiltersChange = (newFilters: JobFiltersState) => {
    setFilters(newFilters)
    // Trigger job search with new filters
  }
  
  const handleApplyFilters = (filters: JobFiltersState) => {
    // Apply filters and close mobile sheet
    setShowMobileFilters(false)
  }
  
  return (
    <div className="flex gap-6">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-80">
          <JobFilters
            initialFilters={filters}
            onFiltersChange={handleFiltersChange}
            onApply={handleApplyFilters}
          />
        </div>
      )}
      
      {/* Mobile Bottom Sheet */}
      <JobFilters
        initialFilters={filters}
        onFiltersChange={handleFiltersChange}
        onApply={handleApplyFilters}
        onClose={() => setShowMobileFilters(false)}
        isMobile={true}
        showAsBottomSheet={true}
        isOpen={showMobileFilters}
      />
      
      {/* Job Results */}
      <div className="flex-1">
        {/* Job listings filtered by current filters */}
      </div>
    </div>
  )
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| initialFilters | JobFiltersState | No | Initial filter values |
| onFiltersChange | (filters: JobFiltersState) => void | Yes | Callback when filters change |
| onApply | (filters: JobFiltersState) => void | No | Callback when apply button is clicked (mobile) |
| onClose | () => void | No | Callback when bottom sheet is closed (mobile) |
| className | string | No | Additional CSS classes |
| isMobile | boolean | No | Whether to use mobile layout (default: false) |
| showAsBottomSheet | boolean | No | Whether to show as bottom sheet (default: false) |
| isOpen | boolean | No | Whether bottom sheet is open (default: true) |

#### Filter State Interface

```typescript
interface JobFiltersState {
  // Basic filters
  location?: string
  remote?: 'remote' | 'onsite' | 'hybrid' | ''
  specialty?: string
  experience?: 'entry' | 'mid' | 'senior' | 'executive' | ''
  jobType?: JobType | ''
  
  // Salary range
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: 'USD' | 'CAD' | 'EUR' | 'GBP'
  salaryPeriod?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  
  // Date and time filters
  datePosted?: '24h' | '3d' | '7d' | '30d' | ''
  
  // Company filters
  companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | ''
  
  // Benefits and perks
  benefits?: string[]
  
  // Boolean flags
  urgent?: boolean
  featured?: boolean
}
```

#### Mobile Patterns

1. **Bottom Sheet**: Slides up from bottom on mobile devices
2. **Touch Targets**: All interactive elements meet 44px minimum size
3. **Gestures**: Supports swipe-to-close on bottom sheet
4. **Backdrop**: Semi-transparent overlay when filters are open
5. **Responsive Sections**: Collapsible filter sections on mobile

#### Desktop Patterns

1. **Sidebar**: Fixed-width sidebar (320px) for desktop layouts
2. **Persistent Filters**: Always visible filter state
3. **Hover States**: Rich hover interactions for better UX
4. **Expandable Sections**: Collapsible filter categories

#### URL Synchronization

The component automatically syncs filter state with URL parameters:

- Location: `?location=New%20York`
- Remote work: `?remote=remote`
- Specialty: `?specialty=Emergency%20Medicine`
- Experience: `?experience=senior`
- Job type: `?jobType=FULL_TIME`
- Salary: `?salaryMin=80000&salaryMax=150000`
- Date posted: `?datePosted=7d`
- Company size: `?companySize=medium`
- Benefits: `?benefits=Health%20Insurance,Paid%20Time%20Off`
- Urgent: `?urgent=true`
- Featured: `?featured=true`

#### Performance Considerations

1. **Debouncing**: Text inputs are debounced by 300ms
2. **Lazy Loading**: Long lists (specialties, benefits) support lazy loading
3. **Virtualization**: Ready for virtual scrolling with react-window
4. **Memoization**: Filter computations are memoized for performance
5. **Bundle Size**: Optimized imports to minimize bundle impact

#### Testing

The component includes comprehensive tests covering:
- Filter interaction and state management
- Mobile bottom sheet behavior
- URL synchronization
- Accessibility features
- Performance characteristics
- Cross-platform compatibility

Run tests with:
```bash
npm run test -- job-filters.test.tsx
```

#### Cross-Platform Notes

- Component uses only cross-platform compatible APIs
- Styles use Tailwind classes that map to React Native styles
- Event handlers are abstracted for platform-specific implementations
- No direct DOM manipulation or browser-specific features
- TypeScript interfaces are shared between web and mobile

#### Future Enhancements

- Saved filter presets
- Filter history and suggestions
- Advanced location-based filters (radius, multiple locations)
- Salary negotiation indicators
- Real-time job count updates
- Filter analytics and recommendations
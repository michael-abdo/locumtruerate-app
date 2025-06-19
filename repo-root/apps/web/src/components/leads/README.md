# Lead Capture Components

Comprehensive lead capture form components for LocumTrueRate.com with mobile-first design, analytics integration, and leads API connectivity.

## 🎯 Components Overview

### 1. **LeadCaptureForm** - Main reusable form component
**File:** `LeadCaptureForm.tsx`

The core lead capture component with mobile-first responsive design and comprehensive feature set.

**Key Features:**
- ✅ Mobile-first responsive design
- ✅ Form validation with React Hook Form + Zod
- ✅ Lead source tracking (URL params, referrer)
- ✅ Integration with leads API router
- ✅ Success states with conversion tracking
- ✅ Multiple variants (default, compact, inline)
- ✅ Accessibility compliant (ARIA labels, focus management)
- ✅ Real-time form validation

**Usage:**
```tsx
import { LeadCaptureForm } from '@/components/leads'

<LeadCaptureForm
  source="landing_page"
  variant="default"
  title="Get Started Today"
  ctaText="Request Information"
  onSuccess={(leadId) => console.log('Lead created:', leadId)}
/>
```

### 2. **CalculatorLeadCapture** - Calculator-specific CTA
**File:** `CalculatorLeadCapture.tsx`

Contextual lead capture triggered after calculation completion with calculation data integration.

**Key Features:**
- ✅ Triggered after calculation completion
- ✅ Includes calculation data in lead metadata
- ✅ "Get personalized recommendations" CTA
- ✅ Quick form with minimal friction
- ✅ Auto-trigger with configurable delay
- ✅ Insights generation based on calculation values
- ✅ Multiple display variants (popup, inline, sidebar)

**Usage:**
```tsx
import { CalculatorLeadCapture } from '@/components/leads'

<CalculatorLeadCapture
  calculationData={{
    type: 'contract',
    annualSalary: 250000,
    hourlyRate: 120,
    location: 'Los Angeles, CA'
  }}
  variant="popup"
  delay={3000}
  onDismiss={() => console.log('User dismissed')}
/>
```

### 3. **ContactFormModal** - Modal version for CTAs
**File:** `ContactFormModal.tsx`

Modal overlay for contact forms with multiple trigger sources and quick action buttons.

**Key Features:**
- ✅ Modal with backdrop and focus trap
- ✅ Quick contact form with action selection
- ✅ Multiple trigger sources tracking
- ✅ Built-in trigger hooks (exit intent, scroll, time)
- ✅ Variant support (contact, demo, support, consultation)
- ✅ Accessibility compliant modal

**Usage:**
```tsx
import { ContactFormModal, useExitIntent } from '@/components/leads'

function MyPage() {
  const [showModal, setShowModal] = useState(false)
  
  useExitIntent(() => setShowModal(true), true)
  
  return (
    <ContactFormModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      trigger="exit_intent"
      variant="contact"
      showQuickActions={true}
    />
  )
}
```

### 4. **NewsletterSignup** - Simple email capture
**File:** `NewsletterSignup.tsx`

Email-only signup component for newsletters with double opt-in flow support.

**Key Features:**
- ✅ Email-only signup for newsletters
- ✅ Multiple variants (default, minimal, featured, footer, inline)
- ✅ Benefits display with customizable list
- ✅ Double opt-in flow messaging
- ✅ Trust indicators and privacy notes
- ✅ Configurable sizing (sm, md, lg)

**Usage:**
```tsx
import { NewsletterSignup } from '@/components/leads'

<NewsletterSignup
  variant="featured"
  size="lg"
  title="Join 10,000+ Medical Professionals"
  showBenefits={true}
  benefits={[
    'Weekly market insights',
    'Exclusive job alerts',
    'Industry news updates'
  ]}
/>
```

### 5. **DemoRequestForm** - Demo/consultation requests
**File:** `DemoRequestForm.tsx`

Comprehensive form for demo and consultation requests with detailed company information fields.

**Key Features:**
- ✅ Scheduling integration ready
- ✅ Detailed company information fields
- ✅ Use case and requirements collection
- ✅ Team size and urgency tracking
- ✅ Benefits display and testimonials
- ✅ Multiple variants (full, compact, consultation)
- ✅ Success state with next steps

**Usage:**
```tsx
import { DemoRequestForm } from '@/components/leads'

<DemoRequestForm
  variant="full"
  showBenefits={true}
  showTestimonial={true}
  title="Schedule Your Personalized Demo"
  ctaText="Request Demo"
/>
```

## 🛠 Technical Implementation

### API Integration
All forms integrate with the leads API at `/repo-root/packages/api/src/routers/leads.ts`:

```typescript
// Uses TRPC mutation
const createLeadMutation = trpc.leads.create.useMutation({
  onSuccess: (result) => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  }
})
```

### Analytics Tracking
Comprehensive analytics integration using the analytics provider:

```typescript
import { usePageAnalytics } from '@/hooks/use-analytics'

const analytics = usePageAnalytics()

// Track form interactions
analytics.trackFeatureUsage('lead_capture', {
  source: 'calculator',
  variant: 'popup',
  leadId: result.id
})
```

### Form Validation
All forms use React Hook Form with Zod validation:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name required')
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
})
```

## 📱 Mobile-First Design

All components are built with mobile-first responsive design:

- **Responsive layouts** that work on all screen sizes
- **Touch-friendly** interactive elements (44px minimum touch targets)
- **Optimized forms** for mobile keyboards
- **Cross-platform compatibility** for React Native adaptation
- **Accessible navigation** for screen readers

## 🎨 Variant System

Each component supports multiple variants for different use cases:

### LeadCaptureForm Variants:
- `default` - Full form with all fields
- `compact` - Condensed version for modals
- `inline` - Minimal inline version

### CalculatorLeadCapture Variants:
- `popup` - Fixed position overlay
- `inline` - Embedded in content
- `sidebar` - Side panel display

### ContactFormModal Variants:
- `contact` - General contact form
- `demo` - Demo request focused
- `support` - Support request
- `consultation` - Expert consultation

### NewsletterSignup Variants:
- `default` - Standard newsletter signup
- `minimal` - Compact version
- `featured` - Highlighted with benefits
- `footer` - Footer optimized
- `inline` - Content embedded

### DemoRequestForm Variants:
- `full` - Complete form with all fields
- `compact` - Essential fields only
- `consultation` - Consultation focused

## 🔧 Advanced Features

### 1. Trigger Hooks
Built-in hooks for advanced triggering:

```tsx
import { useExitIntent, useScrollTrigger, useTimeTrigger } from '@/components/leads'

// Exit intent detection
useExitIntent(() => setShowModal(true), enabled)

// Scroll percentage trigger
useScrollTrigger(75, () => setShowForm(true), enabled)

// Time-based trigger
useTimeTrigger(30000, () => setShowCTA(true), enabled)
```

### 2. Lead Source Tracking
Automatic source tracking with UTM parameter detection:

```typescript
// Automatically tracks:
// - UTM parameters (source, medium, campaign)
// - Referrer information
// - Page context
// - User behavior data

metadata: {
  utm: {
    source: 'google',
    medium: 'cpc',
    campaign: 'locum_jobs'
  },
  referrer: 'https://google.com',
  userAgent: navigator.userAgent,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
}
```

### 3. A/B Testing Support
Components support A/B testing through variant props:

```tsx
<LeadCaptureForm
  variant={abTest.variant}
  testId={`lead-form-${abTest.variant}`}
  metadata={{ abTestVariant: abTest.variant }}
/>
```

### 4. Accessibility Features
All components include comprehensive accessibility:

- **ARIA labels** and descriptions
- **Focus management** and keyboard navigation
- **Screen reader** announcements
- **Error messaging** with ARIA live regions
- **Color contrast** compliance
- **Touch targets** minimum 44px

## 📊 Analytics Events

### Tracked Events:
- `lead_capture` - Form submission
- `lead_capture_opened` - Form displayed
- `lead_capture_dismissed` - Form dismissed
- `calculator_lead_capture_triggered` - Calculator CTA shown
- `newsletter_signup` - Newsletter subscription
- `demo_request` - Demo form submission
- `contact_modal_opened` - Modal displayed

### Event Data:
```typescript
{
  source: string,           // Lead source identifier
  sourceId?: string,        // Additional source context
  variant: string,          // Component variant used
  leadId?: string,          // Generated lead ID
  formData?: object,        // Form completion data
  userAgent: string,        // Browser information
  timestamp: number         // Event timestamp
}
```

## 🔒 Security & Privacy

### Data Protection:
- **Input validation** on client and server
- **Spam detection** with keyword filtering
- **Rate limiting** prevents abuse
- **Privacy compliance** with GDPR notes
- **Secure transmission** with HTTPS
- **No sensitive data** in analytics

### Privacy Features:
- Clear privacy policy links
- Unsubscribe options
- Data retention notices
- Double opt-in for newsletters
- Consent tracking

## 🚀 Performance Optimization

### Loading States:
- **Skeleton loaders** during form submission
- **Progressive enhancement** for slow connections
- **Error recovery** with retry mechanisms
- **Optimistic updates** for better UX

### Bundle Optimization:
- **Tree shaking** support with named exports
- **Code splitting** for large forms
- **Lazy loading** of non-critical features
- **Minimal dependencies** for fast loading

## 📋 Testing

### Test Coverage:
- **Unit tests** for form validation
- **Integration tests** for API calls
- **Accessibility tests** with axe-core
- **Visual regression** tests
- **Cross-browser** compatibility

### Test IDs:
All components include `data-testid` attributes for reliable testing:

```tsx
data-testid="lead-capture-form"
data-testid="email-input"
data-testid="submit-button"
```

## 🔗 Integration Guide

### Basic Setup:
```tsx
import { LeadCaptureForm } from '@/components/leads'

export default function LandingPage() {
  return (
    <div>
      <h1>Welcome to LocumTrueRate</h1>
      <LeadCaptureForm
        source="landing_page"
        title="Get Started Today"
        description="Join thousands of medical professionals"
        ctaText="Start Free Trial"
      />
    </div>
  )
}
```

### Advanced Usage:
```tsx
import { 
  CalculatorLeadCapture, 
  ContactFormModal, 
  useExitIntent 
} from '@/components/leads'

export default function CalculatorPage() {
  const [showModal, setShowModal] = useState(false)
  const [calculationComplete, setCalculationComplete] = useState(false)
  const [calculationData, setCalculationData] = useState(null)

  useExitIntent(() => setShowModal(true), !calculationComplete)

  return (
    <div>
      {/* Calculator component */}
      
      {calculationComplete && (
        <CalculatorLeadCapture
          calculationData={calculationData}
          variant="popup"
          delay={2000}
        />
      )}
      
      <ContactFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        trigger="exit_intent"
        variant="consultation"
      />
    </div>
  )
}
```

## 🏗 Architecture Notes

### Cross-Platform Compatibility:
- Uses React components compatible with React Native
- Avoids web-only APIs
- Responsive design patterns
- Shared business logic

### API Integration:
- TRPC for type-safe API calls
- Automatic retry logic
- Error handling with user feedback
- Loading states management

### State Management:
- Local component state with useState
- Form state with React Hook Form
- Analytics state through context
- No global state dependencies

This comprehensive lead capture system provides everything needed for effective lead generation while maintaining the mobile-first, cross-platform architecture requirements of the LocumTrueRate platform.
import { Metadata } from 'next'
import { HeroSection } from '@/components/sections/hero-section'
import { 
  FeaturesSection, CalculatorPreview, JobsPreview,
  TestimonialsSection, CTASection
} from '@/components/placeholder'

export const metadata: Metadata = {
  title: 'LocumTrueRate - Find Your Perfect Healthcare Opportunity',
  description: 'Discover transparent locum tenens opportunities with our advanced contract calculator. Compare real compensation, analyze benefits, and find your ideal healthcare position.',
  openGraph: {
    title: 'LocumTrueRate - Find Your Perfect Healthcare Opportunity',
    description: 'Discover transparent locum tenens opportunities with our advanced contract calculator.',
    url: '/',
    images: [
      {
        url: '/og-homepage.png',
        width: 1200,
        height: 630,
        alt: 'LocumTrueRate Homepage',
      },
    ],
  },
}

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Overview */}
      <FeaturesSection />
      
      {/* Interactive Calculator Preview */}
      <CalculatorPreview />
      
      {/* Featured Jobs */}
      <JobsPreview />
      
      {/* Social Proof */}
      <TestimonialsSection />
      
      {/* Call to Action */}
      <CTASection />
    </>
  )
}
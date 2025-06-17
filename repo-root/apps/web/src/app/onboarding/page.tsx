'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, Briefcase, Stethoscope, MapPin, DollarSign, 
  Calendar, Award, ChevronRight, Check, ArrowRight
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@locumtruerate/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useClerkUser } from '@/hooks/use-clerk-user'
import { trpc } from '@/providers/trpc-provider'

type OnboardingStep = 'role' | 'specialty' | 'experience' | 'preferences' | 'complete'

const roles = [
  { id: 'physician', name: 'Physician', icon: Stethoscope },
  { id: 'nurse-practitioner', name: 'Nurse Practitioner', icon: User },
  { id: 'physician-assistant', name: 'Physician Assistant', icon: Briefcase },
  { id: 'crna', name: 'CRNA', icon: Award },
]

const specialties = [
  'Emergency Medicine',
  'Family Medicine',
  'Internal Medicine',
  'Pediatrics',
  'Psychiatry',
  'Anesthesiology',
  'Radiology',
  'Surgery',
  'Obstetrics & Gynecology',
  'Critical Care',
  'Hospitalist',
  'Other'
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, displayName } = useClerkUser()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('role')
  const [formData, setFormData] = useState({
    role: '',
    specialty: '',
    yearsExperience: '',
    currentLocation: '',
    desiredLocations: [] as string[],
    salaryExpectation: '',
    availability: '',
  })

  const updateProfileMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      router.push('/dashboard')
    }
  })

  const handleNext = () => {
    const steps: OnboardingStep[] = ['role', 'specialty', 'experience', 'preferences', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handleComplete = async () => {
    await updateProfileMutation.mutateAsync({
      role: formData.role,
      specialty: formData.specialty,
      yearsExperience: parseInt(formData.yearsExperience),
      location: formData.currentLocation,
      preferences: {
        desiredLocations: formData.desiredLocations,
        salaryExpectation: formData.salaryExpectation,
        availability: formData.availability,
      }
    })
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'role':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome, {displayName}! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Let's get your profile set up. First, what's your healthcare role?
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => {
                const Icon = role.icon
                return (
                  <Card
                    key={role.id}
                    className={`cursor-pointer transition-all ${
                      formData.role === role.id
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => setFormData({ ...formData, role: role.id })}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {role.name}
                          </h3>
                        </div>
                        {formData.role === role.id && (
                          <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </motion.div>
        )

      case 'specialty':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              What's your specialty?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              This helps us match you with the most relevant opportunities
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {specialties.map((specialty) => (
                <Badge
                  key={specialty}
                  variant={formData.specialty === specialty ? 'default' : 'outline'}
                  className={`p-3 justify-center cursor-pointer transition-all ${
                    formData.specialty === specialty
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setFormData({ ...formData, specialty })}
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          </motion.div>
        )

      case 'experience':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Tell us about your experience
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              This information helps us personalize your job recommendations
            </p>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="yearsExperience">Years of Experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="currentLocation">Current Location</Label>
                <Input
                  id="currentLocation"
                  placeholder="City, State"
                  value={formData.currentLocation}
                  onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
          </motion.div>
        )

      case 'preferences':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your job preferences
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              We'll use this to find the perfect matches for you
            </p>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="salaryExpectation">Desired Salary Range</Label>
                <Input
                  id="salaryExpectation"
                  placeholder="e.g., $250,000 - $350,000"
                  value={formData.salaryExpectation}
                  onChange={(e) => setFormData({ ...formData, salaryExpectation: e.target.value })}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="availability">When can you start?</Label>
                <select
                  id="availability"
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select availability</option>
                  <option value="immediately">Immediately</option>
                  <option value="2-weeks">Within 2 weeks</option>
                  <option value="1-month">Within 1 month</option>
                  <option value="2-months">Within 2 months</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>
          </motion.div>
        )

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-8"
          >
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              You're all set! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Your profile is complete. We're already finding the best locum opportunities for you.
            </p>
            
            <Button onClick={handleComplete} size="lg" disabled={updateProfileMutation.isLoading}>
              {updateProfileMutation.isLoading ? 'Setting up...' : 'Go to Dashboard'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'role':
        return !!formData.role
      case 'specialty':
        return !!formData.specialty
      case 'experience':
        return !!formData.yearsExperience && !!formData.currentLocation
      case 'preferences':
        return !!formData.salaryExpectation && !!formData.availability
      default:
        return true
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {['role', 'specialty', 'experience', 'preferences'].map((step, index) => (
                <div
                  key={step}
                  className={`flex-1 ${
                    index > 0 ? 'ml-2' : ''
                  }`}
                >
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      ['role', 'specialty', 'experience', 'preferences'].indexOf(currentStep) >= index
                        ? 'bg-blue-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <Card>
            <CardContent className="p-8">
              {renderStep()}
              
              {currentStep !== 'complete' && (
                <div className="mt-8 flex justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const steps: OnboardingStep[] = ['role', 'specialty', 'experience', 'preferences']
                      const currentIndex = steps.indexOf(currentStep)
                      if (currentIndex > 0) {
                        setCurrentStep(steps[currentIndex - 1])
                      }
                    }}
                    disabled={currentStep === 'role'}
                  >
                    Back
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                  >
                    {currentStep === 'preferences' ? 'Complete Setup' : 'Continue'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}
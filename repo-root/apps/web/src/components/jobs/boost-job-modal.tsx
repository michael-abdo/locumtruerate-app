'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  X, 
  Zap, 
  Star, 
  TrendingUp, 
  Crown,
  Check,
  CreditCard,
  Calendar,
  Users,
  Eye,
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { cn } from '@/lib/utils'
import { BoostedJobBadge, type BoostType } from './boosted-job-badge'
import type { Job } from '@locumtruerate/types'

// Boost package definitions
interface BoostPackage {
  id: string
  name: string
  type: BoostType
  icon: React.ComponentType<{ className?: string }>
  price: number
  duration: number // in days
  benefits: string[]
  popularMultiplier: number // How much it increases visibility
  color: string
  description: string
  features: {
    searchPlacement: string
    visibility: string
    applicationBoost: string
    duration: string
  }
}

const boostPackages: BoostPackage[] = [
  {
    id: 'featured',
    name: 'Featured Listing',
    type: 'featured',
    icon: Star,
    price: 49,
    duration: 7,
    popularMultiplier: 3,
    color: 'from-yellow-400 to-orange-500',
    description: 'Stand out with a highlighted listing that catches attention',
    benefits: [
      'Highlighted with gold border',
      '3x more visibility',
      'Priority in search results',
      'Featured badge display'
    ],
    features: {
      searchPlacement: 'Top 3 results',
      visibility: '+300%',
      applicationBoost: '+150%',
      duration: '7 days'
    }
  },
  {
    id: 'urgent',
    name: 'Urgent Hiring',
    type: 'urgent',
    icon: Zap,
    price: 29,
    duration: 3,
    popularMultiplier: 2,
    color: 'from-red-500 to-pink-600',
    description: 'Perfect for immediate hiring needs with urgent priority',
    benefits: [
      'Urgent badge and red highlight',
      '2x faster applications',
      'Email alerts to candidates',
      'Rush processing'
    ],
    features: {
      searchPlacement: 'Urgent section',
      visibility: '+200%',
      applicationBoost: '+100%',
      duration: '3 days'
    }
  },
  {
    id: 'premium',
    name: 'Premium Boost',
    type: 'premium',
    icon: Crown,
    price: 99,
    duration: 14,
    popularMultiplier: 5,
    color: 'from-purple-600 to-indigo-600',
    description: 'Maximum exposure with premium placement and features',
    benefits: [
      'Top placement guaranteed',
      '5x visibility boost',
      'Featured in newsletter',
      'Social media promotion',
      'Candidate matching service'
    ],
    features: {
      searchPlacement: '#1 position',
      visibility: '+500%',
      applicationBoost: '+250%',
      duration: '14 days'
    }
  },
  {
    id: 'sponsored',
    name: 'Sponsored Post',
    type: 'sponsored',
    icon: TrendingUp,
    price: 79,
    duration: 10,
    popularMultiplier: 4,
    color: 'from-blue-500 to-cyan-600',
    description: 'Professional sponsored placement with enhanced features',
    benefits: [
      'Sponsored badge',
      '4x increased reach',
      'Cross-platform promotion',
      'Analytics dashboard'
    ],
    features: {
      searchPlacement: 'Sponsored section',
      visibility: '+400%',
      applicationBoost: '+200%',
      duration: '10 days'
    }
  }
]

// Form validation schema
const boostJobSchema = z.object({
  packageId: z.string().min(1, 'Please select a boost package'),
  paymentMethod: z.enum(['card', 'invoice']).default('card'),
  agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  startDate: z.enum(['now', 'scheduled']).default('now'),
  scheduledDate: z.date().optional()
})

type BoostJobFormData = z.infer<typeof boostJobSchema>

interface BoostJobModalProps {
  job: Job
  onClose: () => void
  onSubmit: (data: BoostJobFormData & { packageDetails: BoostPackage }) => Promise<void>
  isOpen?: boolean
}

const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

const contentVariants = {
  hidden: { scale: 0.95, opacity: 0, y: 20 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 }
  },
  exit: { scale: 0.95, opacity: 0, y: 20 }
}

export function BoostJobModal({ 
  job, 
  onClose, 
  onSubmit, 
  isOpen = true 
}: BoostJobModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'select' | 'checkout'>('select')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue
  } = useForm<BoostJobFormData>({
    resolver: zodResolver(boostJobSchema),
    mode: 'onChange'
  })

  const watchedPackageId = watch('packageId')
  const selectedPackageDetails = boostPackages.find(p => p.id === watchedPackageId)

  const handlePackageSelect = useCallback((packageId: string) => {
    setSelectedPackage(packageId)
    setValue('packageId', packageId, { shouldValidate: true })
  }, [setValue])

  const handleNext = useCallback(() => {
    if (selectedPackageDetails) {
      setStep('checkout')
    }
  }, [selectedPackageDetails])

  const handleBack = useCallback(() => {
    setStep('select')
  }, [])

  const onFormSubmit = async (data: BoostJobFormData) => {
    if (!selectedPackageDetails) return

    setIsSubmitting(true)
    try {
      await onSubmit({ ...data, packageDetails: selectedPackageDetails })
      onClose()
    } catch (error) {
      console.error('Failed to boost job:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateROI = (pkg: BoostPackage) => {
    const baseCost = pkg.price
    const estimatedExtraApplications = Math.round(10 * pkg.popularMultiplier)
    const costPerApplication = Math.round(baseCost / estimatedExtraApplications)
    return { estimatedExtraApplications, costPerApplication }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          variants={contentVariants}
          className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {step === 'select' ? 'Boost Your Job Listing' : 'Complete Your Boost'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {step === 'select' 
                  ? 'Increase visibility and get more qualified applications'
                  : `Boosting "${job.title}" with ${selectedPackageDetails?.name}`
                }
              </p>
            </div>
            
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              aria-label="Close boost modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Step {step === 'select' ? '1' : '2'} of 2
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {step === 'select' ? 'Select Package' : 'Payment & Launch'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: step === 'select' ? '50%' : '100%' }}
                initial={{ width: 0 }}
                animate={{ width: step === 'select' ? '50%' : '100%' }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {step === 'select' ? (
              /* Package Selection Step */
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Choose Your Boost Package
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select the package that best fits your hiring timeline and budget
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {boostPackages.map((pkg) => {
                    const { estimatedExtraApplications, costPerApplication } = calculateROI(pkg)
                    const isSelected = selectedPackage === pkg.id
                    const Icon = pkg.icon

                    return (
                      <motion.div
                        key={pkg.id}
                        layoutId={`package-${pkg.id}`}
                        className={cn(
                          "relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200",
                          "hover:shadow-lg",
                          isSelected 
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg" 
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                        onClick={() => handlePackageSelect(pkg.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Most Popular Badge */}
                        {pkg.id === 'premium' && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Most Popular
                            </div>
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg bg-gradient-to-r",
                              pkg.color
                            )}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {pkg.name}
                              </h4>
                              <BoostedJobBadge type={pkg.type} size="sm" />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              ${pkg.price}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              for {pkg.duration} days
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          {pkg.description}
                        </p>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              +{estimatedExtraApplications}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Est. Applications
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                              ${costPerApplication}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Cost per Application
                            </div>
                          </div>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {pkg.features.visibility} visibility
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {pkg.features.searchPlacement}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {pkg.features.applicationBoost} applications
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {pkg.features.duration}
                            </span>
                          </div>
                        </div>

                        {/* Benefits List */}
                        <div className="space-y-2">
                          {pkg.benefits.slice(0, 3).map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                            </div>
                          ))}
                          {pkg.benefits.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{pkg.benefits.length - 3} more benefits
                            </div>
                          )}
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Why boost your job listing?
                      </h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Get 2-5x more qualified applications</li>
                        <li>• Reduce time-to-hire by up to 60%</li>
                        <li>• Stand out in a competitive market</li>
                        <li>• Reach passive candidates</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <input type="hidden" {...register('packageId')} />
                {errors.packageId && (
                  <p className="text-sm text-red-600 mb-4">{errors.packageId.message}</p>
                )}
              </div>
            ) : (
              /* Checkout Step */
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Review & Payment
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Complete your boost purchase and launch your enhanced listing
                  </p>
                </div>

                {/* Selected Package Summary */}
                {selectedPackageDetails && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <BoostedJobBadge type={selectedPackageDetails.type} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {selectedPackageDetails.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedPackageDetails.duration} days active
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          ${selectedPackageDetails.price}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ${(selectedPackageDetails.price / selectedPackageDetails.duration).toFixed(2)}/day
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Change package
                    </button>
                  </div>
                )}

                {/* Payment Method */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <input
                        {...register('paymentMethod')}
                        type="radio"
                        value="card"
                        className="w-4 h-4 text-blue-600"
                      />
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">Credit Card</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Instant activation</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <input
                        {...register('paymentMethod')}
                        type="radio"
                        value="invoice"
                        className="w-4 h-4 text-blue-600"
                      />
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">Invoice Payment</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">2-3 business days</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Start Date */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    When should the boost start?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <input
                        {...register('startDate')}
                        type="radio"
                        value="now"
                        className="w-4 h-4 text-blue-600"
                      />
                      <Zap className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Start immediately</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Recommended for best results</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="mb-6">
                  <label className="flex items-start gap-3">
                    <input
                      {...register('agreedToTerms')}
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      I agree to the{' '}
                      <a href="/legal/terms" target="_blank" className="text-blue-600 hover:text-blue-700">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/legal/boost-terms" target="_blank" className="text-blue-600 hover:text-blue-700">
                        Boost Terms
                      </a>. Boost packages are non-refundable once activated.
                    </div>
                  </label>
                  {errors.agreedToTerms && (
                    <p className="text-sm text-red-600 mt-1">{errors.agreedToTerms.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                {step === 'select' ? (
                  <>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Secure payment • 30-day money back guarantee
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                      >
                        Maybe Later
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!selectedPackageDetails}
                        className="min-w-[120px]"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!isValid || isSubmitting}
                        className="min-w-[140px]"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Launch Boost
                            <Sparkles className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default BoostJobModal
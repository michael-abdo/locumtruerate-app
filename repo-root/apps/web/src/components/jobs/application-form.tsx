'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  MessageSquare,
  Briefcase
} from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { cn } from '@/lib/utils'
import type { Job } from '@locumtruerate/types'
import { emailSchema, phoneSchema, urlSchema, safeTextSchema, fileUploadSchema } from '@/lib/validation/schemas'

// Resume file validation
const resumeFileSchema = fileUploadSchema.extend({
  type: z.enum([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ], {
    errorMap: () => ({ message: 'Only PDF and Word documents are allowed' })
  }),
  size: z.number().max(5 * 1024 * 1024, 'File must be less than 5MB')
})

// Application form validation schema using standardized validators
const applicationSchema = z.object({
  firstName: safeTextSchema(2, 50),
  lastName: safeTextSchema(2, 50),
  email: emailSchema,
  phone: phoneSchema,
  linkedinUrl: urlSchema.optional().or(z.literal('')),
  portfolioUrl: urlSchema.optional().or(z.literal('')),
  coverLetter: safeTextSchema(50, 5000),
  experience: safeTextSchema(10, 2000),
  availability: safeTextSchema(5, 200),
  salaryExpectation: z
    .string()
    .regex(/^\d+$/, 'Please enter a valid number')
    .optional()
    .or(z.literal('')),
  agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  agreedToPrivacy: z.boolean().refine(val => val === true, 'You must agree to the privacy policy')
})

type ApplicationFormData = z.infer<typeof applicationSchema>

interface ApplicationFormProps {
  job: Job
  onClose: () => void
  onSubmit: (data: ApplicationFormData & { resumeFile?: File }) => Promise<void>
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

export function ApplicationForm({ 
  job, 
  onClose, 
  onSubmit, 
  isOpen = true 
}: ApplicationFormProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [dragOver, setDragOver] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    mode: 'onChange'
  })

  // Watch form fields for auto-save/progress
  const watchedFields = watch()

  const handleFileUpload = useCallback((file: File) => {
    try {
      // Validate file using our schema
      resumeFileSchema.parse({
        name: file.name,
        type: file.type,
        size: file.size
      })
      
      setResumeFile(file)
    } catch (error) {
      if (error instanceof z.ZodError) {
        alert(error.errors[0].message)
      } else {
        alert('Error uploading file')
      }
      return
    }

    if (file.size > maxSize) {
      alert('File size must be less than 5MB')
      return
    }

    setResumeFile(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const onFormSubmit = async (data: ApplicationFormData) => {
    if (!resumeFile) {
      alert('Please upload your resume')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      await onSubmit({ ...data, resumeFile })
      setSubmitStatus('success')
      
      // Close modal after success delay
      setTimeout(() => {
        onClose()
        reset()
        setResumeFile(null)
      }, 2000)
    } catch (error) {
      setSubmitStatus('error')
      console.error('Application submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose()
      reset()
      setResumeFile(null)
      setSubmitStatus('idle')
    }
  }, [isSubmitting, onClose, reset])

  // Calculate form completion percentage
  const completedFields = Object.values(watchedFields).filter(value => 
    value !== undefined && value !== '' && value !== false
  ).length
  const totalFields = Object.keys(applicationSchema.shape).length
  const completionPercentage = Math.round((completedFields / totalFields) * 100)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          variants={contentVariants}
          className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Apply for {job.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {job.company?.name} • {job.location}
              </p>
            </div>
            
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              aria-label="Close application form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Application Progress
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit(onFormSubmit)} className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name *
                    </label>
                    <input
                      {...register('firstName')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                        "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
                        errors.firstName && "border-red-500 focus:ring-red-500"
                      )}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      {...register('lastName')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                        "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
                        errors.lastName && "border-red-500 focus:ring-red-500"
                      )}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                        "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
                        errors.email && "border-red-500 focus:ring-red-500"
                      )}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                        "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
                        errors.phone && "border-red-500 focus:ring-red-500"
                      )}
                      placeholder="(555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      {...register('linkedinUrl')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                        "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
                        errors.linkedinUrl && "border-red-500 focus:ring-red-500"
                      )}
                      placeholder="https://linkedin.com/in/your-profile"
                    />
                    {errors.linkedinUrl && (
                      <p className="text-sm text-red-600 mt-1">{errors.linkedinUrl.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Portfolio/Website
                    </label>
                    <input
                      type="url"
                      {...register('portfolioUrl')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                        "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
                        errors.portfolioUrl && "border-red-500 focus:ring-red-500"
                      )}
                      placeholder="https://yourportfolio.com"
                    />
                    {errors.portfolioUrl && (
                      <p className="text-sm text-red-600 mt-1">{errors.portfolioUrl.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Resume Upload */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                  <FileText className="w-5 h-5" />
                  Resume *
                </h3>
                
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    dragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600",
                    resumeFile && "border-green-500 bg-green-50 dark:bg-green-900/20"
                  )}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                >
                  {resumeFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{resumeFile.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={() => setResumeFile(null)}
                          className="text-sm text-red-600 hover:text-red-700 mt-1"
                        >
                          Remove file
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-900 dark:text-white font-medium mb-1">
                        Drop your resume here, or 
                        <label className="text-blue-600 hover:text-blue-700 cursor-pointer ml-1">
                          browse
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                        </label>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        PDF, DOC, or DOCX (max 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Application Details */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                  <Briefcase className="w-5 h-5" />
                  Application Details
                </h3>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <MessageSquare className="w-4 h-4" />
                    Cover Letter *
                  </label>
                  <textarea
                    {...register('coverLetter')}
                    rows={4}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none",
                      "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
                      errors.coverLetter && "border-red-500 focus:ring-red-500"
                    )}
                    placeholder="Tell us why you're the perfect fit for this role..."
                  />
                  {errors.coverLetter && (
                    <p className="text-sm text-red-600 mt-1">{errors.coverLetter.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Relevant Experience *
                  </label>
                  <textarea
                    {...register('experience')}
                    rows={3}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none",
                      "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
                      errors.experience && "border-red-500 focus:ring-red-500"
                    )}
                    placeholder="Describe your relevant experience and qualifications..."
                  />
                  {errors.experience && (
                    <p className="text-sm text-red-600 mt-1">{errors.experience.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Availability *
                    </label>
                    <input
                      {...register('availability')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                        "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
                        errors.availability && "border-red-500 focus:ring-red-500"
                      )}
                      placeholder="e.g., Immediate, 2 weeks notice"
                    />
                    {errors.availability && (
                      <p className="text-sm text-red-600 mt-1">{errors.availability.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Salary Expectation
                    </label>
                    <input
                      {...register('salaryExpectation')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-800 dark:text-white"
                      placeholder="e.g., $80,000 - $100,000"
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    {...register('agreedToTerms')}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    I agree to the{' '}
                    <a href="/legal/terms" target="_blank" className="text-blue-600 hover:text-blue-700">
                      Terms of Service
                    </a>{' '}
                    and acknowledge that my application will be shared with the employer. *
                  </label>
                </div>
                {errors.agreedToTerms && (
                  <p className="text-sm text-red-600">{errors.agreedToTerms.message}</p>
                )}

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    {...register('agreedToPrivacy')}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    I have read and agree to the{' '}
                    <a href="/legal/privacy" target="_blank" className="text-blue-600 hover:text-blue-700">
                      Privacy Policy
                    </a>. *
                  </label>
                </div>
                {errors.agreedToPrivacy && (
                  <p className="text-sm text-red-600">{errors.agreedToPrivacy.message}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-green-600 mb-4"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Application submitted successfully!</span>
                </motion.div>
              )}

              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-600 mb-4"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span>Failed to submit application. Please try again.</span>
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="order-2 sm:order-1"
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={!isValid || !resumeFile || isSubmitting || submitStatus === 'success'}
                  className="order-1 sm:order-2 min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : submitStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submitted!
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
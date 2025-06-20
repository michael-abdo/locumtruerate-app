'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Mail, Phone, MapPin, Camera, Save, 
  Plus, Edit3, Trash2, Award, Briefcase, 
  GraduationCap, FileText, Star, Calendar,
  Building, Stethoscope, Shield, Globe, AlertCircle
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@locumtruerate/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { trpc } from '@/providers/trpc-provider'
import { profileUpdateSchema, emailSchema, phoneSchema, safeTextSchema, npiSchema, licenseNumberSchema } from '@/lib/validation/schemas'
import { z } from 'zod'
import { safeParse } from '@/lib/validation/apply-validation'

type ProfileSection = 'personal' | 'experience' | 'education' | 'certifications' | 'preferences'

const experienceItems = [
  {
    id: '1',
    title: 'Emergency Medicine Physician',
    company: 'St. Mary\'s Regional Medical Center',
    location: 'Phoenix, AZ',
    startDate: '2020-03',
    endDate: null,
    current: true,
    description: 'Lead emergency physician managing high-acuity cases in a Level 1 trauma center. Supervise residents and coordinate with multidisciplinary teams.',
    skills: ['Emergency Medicine', 'Trauma Care', 'Critical Care', 'Team Leadership']
  },
  {
    id: '2',
    title: 'Locum Emergency Medicine Physician',
    company: 'Various Healthcare Partners',
    location: 'Southwest Region',
    startDate: '2018-06',
    endDate: '2020-02',
    current: false,
    description: 'Provided emergency medicine services across multiple facilities. Adapted quickly to different EMR systems and hospital protocols.',
    skills: ['Emergency Medicine', 'Adaptability', 'Multi-system Proficiency']
  }
]

const educationItems = [
  {
    id: '1',
    degree: 'Doctor of Medicine (MD)',
    institution: 'University of Arizona College of Medicine',
    location: 'Tucson, AZ',
    graduationYear: '2014',
    gpa: '3.9',
    honors: 'Magna Cum Laude'
  },
  {
    id: '2',
    degree: 'Bachelor of Science in Biology',
    institution: 'Arizona State University',
    location: 'Tempe, AZ',
    graduationYear: '2010',
    gpa: '3.8',
    honors: 'Summa Cum Laude'
  }
]

const certifications = [
  {
    id: '1',
    name: 'Board Certification in Emergency Medicine',
    issuer: 'American Board of Emergency Medicine',
    issueDate: '2017-08',
    expiryDate: '2027-08',
    status: 'Active'
  },
  {
    id: '2',
    name: 'Advanced Cardiac Life Support (ACLS)',
    issuer: 'American Heart Association',
    issueDate: '2023-06',
    expiryDate: '2025-06',
    status: 'Active'
  },
  {
    id: '3',
    name: 'Pediatric Advanced Life Support (PALS)',
    issuer: 'American Heart Association',
    issueDate: '2023-04',
    expiryDate: '2025-04',
    status: 'Active'
  }
]

// Extend profile update schema for additional fields
const extendedProfileSchema = profileUpdateSchema.extend({
  location: safeTextSchema(2, 100).optional(),
  yearsExperience: z.coerce.number().min(0).max(70).optional(),
  jobType: safeTextSchema(2, 50).optional(),
  salaryRange: safeTextSchema(5, 50).optional(),
  preferredLocations: safeTextSchema(5, 200).optional(),
  schedule: safeTextSchema(2, 50).optional(),
  travelRadius: safeTextSchema(2, 50).optional(),
  requirements: safeTextSchema(0, 500).optional()
})

type ProfileFormData = z.infer<typeof extendedProfileSchema>

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<ProfileSection>('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState('/placeholder-avatar.jpg')
  const [formData, setFormData] = useState<ProfileFormData>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // API calls
  const { data: user, isLoading } = trpc.users.getProfile.useQuery()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFieldChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation error for this field when user types
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSave = async () => {
    const result = safeParse(extendedProfileSchema, formData)
    
    if (!result.success) {
      setValidationErrors(result.errors)
      return
    }
    
    try {
      // TODO: Implement API call to save profile
      console.log('Saving validated data:', result.data)
      setIsEditing(false)
      setValidationErrors({})
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mt-4"></div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <div className="space-y-4">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Page Header */}
        <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Professional Profile
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Manage your professional information and preferences
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                {isEditing ? (
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-1"
            >
              <Card>
                <CardContent className="p-6">
                  {/* Profile Image */}
                  <div className="text-center mb-6">
                    <div className="relative inline-block">
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                      />
                      {isEditing && (
                        <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                          <Camera className="h-4 w-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                      Dr. {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Emergency Medicine Physician
                    </p>
                  </div>

                  {/* Navigation */}
                  <nav className="space-y-2">
                    {[
                      { id: 'personal', label: 'Personal Info', icon: User },
                      { id: 'experience', label: 'Experience', icon: Briefcase },
                      { id: 'education', label: 'Education', icon: GraduationCap },
                      { id: 'certifications', label: 'Certifications', icon: Award },
                      { id: 'preferences', label: 'Preferences', icon: FileText }
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id as ProfileSection)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                            activeSection === item.id
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </button>
                      )
                    })}
                  </nav>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-3"
            >
              {/* Personal Information */}
              {activeSection === 'personal' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          defaultValue={user?.firstName || ''}
                          onChange={(e) => handleFieldChange('firstName', e.target.value)}
                          disabled={!isEditing}
                          className={validationErrors.firstName ? 'border-red-500' : ''}
                          aria-invalid={!!validationErrors.firstName}
                          aria-describedby={validationErrors.firstName ? 'firstName-error' : undefined}
                        />
                        {validationErrors.firstName && (
                          <p id="firstName-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {validationErrors.firstName}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          defaultValue={user?.lastName || ''}
                          onChange={(e) => handleFieldChange('lastName', e.target.value)}
                          disabled={!isEditing}
                          className={validationErrors.lastName ? 'border-red-500' : ''}
                          aria-invalid={!!validationErrors.lastName}
                          aria-describedby={validationErrors.lastName ? 'lastName-error' : undefined}
                        />
                        {validationErrors.lastName && (
                          <p id="lastName-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {validationErrors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue={user?.email || ''}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          disabled={!isEditing}
                          className={validationErrors.email ? 'border-red-500' : ''}
                          aria-invalid={!!validationErrors.email}
                          aria-describedby={validationErrors.email ? 'email-error' : undefined}
                        />
                        {validationErrors.email && (
                          <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {validationErrors.email}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          defaultValue="+1 (555) 123-4567"
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          disabled={!isEditing}
                          className={validationErrors.phone ? 'border-red-500' : ''}
                          aria-invalid={!!validationErrors.phone}
                          aria-describedby={validationErrors.phone ? 'phone-error' : undefined}
                        />
                        {validationErrors.phone && (
                          <p id="phone-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {validationErrors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        defaultValue="Phoenix, AZ"
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Professional Summary</Label>
                      <Textarea
                        id="bio"
                        rows={4}
                        defaultValue="Board-certified Emergency Medicine physician with 8+ years of experience in high-acuity settings. Expertise in trauma care, critical care, and emergency procedures. Proven track record in locum tenens assignments across diverse healthcare systems."
                        onChange={(e) => handleFieldChange('bio', e.target.value)}
                        disabled={!isEditing}
                        className={validationErrors.bio ? 'border-red-500' : ''}
                        aria-invalid={!!validationErrors.bio}
                        aria-describedby={validationErrors.bio ? 'bio-error' : undefined}
                      />
                      {validationErrors.bio && (
                        <p id="bio-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {validationErrors.bio}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="specialty">Primary Specialty</Label>
                        <Input
                          id="specialty"
                          defaultValue="Emergency Medicine"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="yearsExperience">Years of Experience</Label>
                        <Input
                          id="yearsExperience"
                          type="number"
                          defaultValue="8"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              {activeSection === 'experience' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Professional Experience
                      </CardTitle>
                      {isEditing && (
                        <Button size="sm" variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Experience
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {experienceItems.map((experience) => (
                      <div key={experience.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {experience.title}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-1">
                              <Building className="h-4 w-4" />
                              <span>{experience.company}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {experience.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(experience.startDate).toLocaleDateString('en-US', { 
                                  month: 'short', year: 'numeric' 
                                })} - {experience.current ? 'Present' : 
                                  new Date(experience.endDate!).toLocaleDateString('en-US', { 
                                    month: 'short', year: 'numeric' 
                                  })}
                              </div>
                            </div>
                          </div>
                          {isEditing && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                          {experience.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {experience.skills.map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {activeSection === 'education' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Education
                      </CardTitle>
                      {isEditing && (
                        <Button size="sm" variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Education
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {educationItems.map((education) => (
                      <div key={education.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {education.degree}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-1">
                              <Building className="h-4 w-4" />
                              <span>{education.institution}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {education.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Graduated {education.graduationYear}
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4" />
                                GPA: {education.gpa}
                              </div>
                            </div>
                            {education.honors && (
                              <Badge variant="outline" className="mt-2">
                                {education.honors}
                              </Badge>
                            )}
                          </div>
                          {isEditing && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {activeSection === 'certifications' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Certifications & Licenses
                      </CardTitle>
                      {isEditing && (
                        <Button size="sm" variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Certification
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {cert.name}
                              </h3>
                              <Badge variant={cert.status === 'Active' ? 'success' : 'secondary'}>
                                {cert.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                              <Shield className="h-4 w-4" />
                              <span>{cert.issuer}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                              <span>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {isEditing && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Job Preferences */}
              {activeSection === 'preferences' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Job Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="jobType">Preferred Job Type</Label>
                        <Input
                          id="jobType"
                          defaultValue="Locum Tenens"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="salaryRange">Desired Salary Range</Label>
                        <Input
                          id="salaryRange"
                          defaultValue="$280,000 - $350,000"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="locations">Preferred Locations</Label>
                      <Input
                        id="locations"
                        defaultValue="Southwest US, California, Texas"
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="schedule">Schedule Preference</Label>
                        <Input
                          id="schedule"
                          defaultValue="Flexible"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="travelRadius">Max Travel Distance</Label>
                        <Input
                          id="travelRadius"
                          defaultValue="500 miles"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="requirements">Special Requirements</Label>
                      <Textarea
                        id="requirements"
                        rows={3}
                        defaultValue="Must have trauma center designation. Prefer facilities with latest EMR systems. Housing allowance preferred."
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Notification Preferences */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Notification Preferences
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="emailNotif">Email Notifications</Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Receive job alerts and updates via email
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            id="emailNotif"
                            defaultChecked
                            disabled={!isEditing}
                            className="rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="smsNotif">SMS Notifications</Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Receive urgent job alerts via SMS
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            id="smsNotif"
                            defaultChecked
                            disabled={!isEditing}
                            className="rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
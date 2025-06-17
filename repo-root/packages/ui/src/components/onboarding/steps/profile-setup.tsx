import React, { useState } from 'react'
import { useOnboarding } from '../onboarding-context'

interface ProfileData {
  specialty: string
  experience: string
  preferredLocations: string[]
  contractTypes: string[]
  notifications: {
    email: boolean
    sms: boolean
    jobAlerts: boolean
  }
}

export function ProfileSetup() {
  const { analytics } = useOnboarding()
  const [profile, setProfile] = useState<ProfileData>({
    specialty: '',
    experience: '',
    preferredLocations: [],
    contractTypes: [],
    notifications: {
      email: true,
      sms: false,
      jobAlerts: true,
    },
  })

  const specialties = [
    'Emergency Medicine',
    'Family Medicine',
    'Internal Medicine',
    'Hospitalist',
    'Critical Care',
    'Anesthesiology',
    'Radiology',
    'Psychiatry',
    'Surgery - General',
    'Nursing - ICU',
    'Nursing - Emergency',
    'Nursing - OR',
    'Travel Nursing',
    'Other',
  ]

  const experienceLevels = [
    'New Graduate',
    '1-2 years',
    '3-5 years',
    '6-10 years',
    '11-15 years',
    '15+ years',
  ]

  const contractTypeOptions = [
    'Locum Tenens',
    'Travel Nursing',
    'Per Diem',
    'Permanent Placement',
    'Contract to Hire',
  ]

  const handleSpecialtyChange = (specialty: string) => {
    setProfile(prev => ({ ...prev, specialty }))
    analytics.customEvent('profile_specialty_selected', { specialty })
  }

  const handleLocationToggle = (location: string) => {
    setProfile(prev => ({
      ...prev,
      preferredLocations: prev.preferredLocations.includes(location)
        ? prev.preferredLocations.filter(l => l !== location)
        : [...prev.preferredLocations, location]
    }))
  }

  const handleContractTypeToggle = (type: string) => {
    setProfile(prev => ({
      ...prev,
      contractTypes: prev.contractTypes.includes(type)
        ? prev.contractTypes.filter(t => t !== type)
        : [...prev.contractTypes, type]
    }))
  }

  const handleNotificationChange = (key: keyof ProfileData['notifications'], value: boolean) => {
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      }
    }))
  }

  return (
    <div className="space-y-6" data-onboarding="profile-form">
      {/* Specialty Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What's your specialty? *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {specialties.map(specialty => (
            <button
              key={specialty}
              onClick={() => handleSpecialtyChange(specialty)}
              className={`p-3 text-sm border rounded-lg text-left transition-colors ${
                profile.specialty === specialty
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-field="specialty"
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Years of experience?
        </label>
        <select
          value={profile.experience}
          onChange={(e) => setProfile(prev => ({ ...prev, experience: e.target.value }))}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select experience level</option>
          {experienceLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      {/* Preferred Locations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred locations (select all that apply)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'MI', 'GA', 'NC', 'NJ', 'VA'].map(state => (
            <button
              key={state}
              onClick={() => handleLocationToggle(state)}
              className={`p-2 text-sm border rounded transition-colors ${
                profile.preferredLocations.includes(state)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* Contract Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Interested in these opportunity types?
        </label>
        <div className="space-y-2">
          {contractTypeOptions.map(type => (
            <label key={type} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={profile.contractTypes.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleContractTypeToggle(type)
                  } else {
                    handleContractTypeToggle(type)
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Notification preferences
        </label>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium text-sm">Email notifications</div>
              <div className="text-xs text-gray-500">Calculation results and updates</div>
            </div>
            <input
              type="checkbox"
              checked={profile.notifications.email}
              onChange={(e) => handleNotificationChange('email', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </label>
          
          <label className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium text-sm">SMS alerts</div>
              <div className="text-xs text-gray-500">Urgent job opportunities</div>
            </div>
            <input
              type="checkbox"
              checked={profile.notifications.sms}
              onChange={(e) => handleNotificationChange('sms', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </label>
          
          <label className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium text-sm">Job match alerts</div>
              <div className="text-xs text-gray-500">When new jobs match your criteria</div>
            </div>
            <input
              type="checkbox"
              checked={profile.notifications.jobAlerts}
              onChange={(e) => handleNotificationChange('jobAlerts', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Save indicator */}
      {profile.specialty && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Profile information saved
            </span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            This helps us personalize your experience and show relevant opportunities.
          </p>
        </div>
      )}
    </div>
  )
}
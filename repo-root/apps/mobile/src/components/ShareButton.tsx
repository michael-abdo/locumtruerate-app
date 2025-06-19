/**
 * Share Button Component
 * 
 * Unified share button with native share sheet integration
 */

import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Share,
  Platform,
  Alert
} from 'react-native'
import { trackEvent } from '../services/analytics'

export interface ShareData {
  title: string
  message: string
  url?: string
}

interface ShareButtonProps {
  data: ShareData
  style?: any
  textStyle?: any
  icon?: string
  label?: string
  onShare?: () => void
  onError?: (error: Error) => void
}

export function ShareButton({
  data,
  style,
  textStyle,
  icon = '📤',
  label = 'Share',
  onShare,
  onError
}: ShareButtonProps) {
  const handleShare = async () => {
    try {
      const shareOptions: any = {
        title: data.title,
        message: data.message,
      }

      // On iOS, URL should be separate
      if (Platform.OS === 'ios' && data.url) {
        shareOptions.url = data.url
      } else if (data.url) {
        // On Android, append URL to message
        shareOptions.message = `${data.message}\n\n${data.url}`
      }

      const result = await Share.share(shareOptions)

      if (result.action === Share.sharedAction) {
        trackEvent('calculation_shared', {
          share_method: 'native_share',
          activity_type: result.activityType,
          shared: true
        })
        
        onShare?.()
      } else if (result.action === Share.dismissedAction) {
        trackEvent('calculation_shared', {
          share_method: 'native_share',
          shared: false,
          dismissed: true
        })
      }
    } catch (error) {
      console.error('Share error:', error)
      Alert.alert('Share Failed', 'Unable to share at this time')
      onError?.(error as Error)
    }
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleShare}
    >
      <Text style={[styles.icon, textStyle]}>{icon}</Text>
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </TouchableOpacity>
  )
}

// Specialized share buttons for different content types

export function ShareJobButton({
  jobId,
  jobTitle,
  companyName,
  salary,
  location,
  style
}: {
  jobId: string
  jobTitle: string
  companyName: string
  salary?: string
  location: string
  style?: any
}) {
  const createJobShareData = (): ShareData => {
    const jobUrl = `https://locumtruerate.com/job/${jobId}`
    
    let message = `Check out this opportunity at ${companyName}!\n\n`
    message += `📋 ${jobTitle}\n`
    message += `📍 ${location}\n`
    if (salary) {
      message += `💰 ${salary}\n`
    }
    
    return {
      title: `${jobTitle} at ${companyName}`,
      message,
      url: jobUrl
    }
  }

  return (
    <ShareButton
      data={createJobShareData()}
      style={style}
      label="Share Job"
      onShare={() => {
        trackEvent('job_shared', {
          job_id: jobId,
          job_title: jobTitle,
          company: companyName
        })
      }}
    />
  )
}

export function ShareCalculationButton({
  type,
  results,
  inputs,
  style
}: {
  type: 'contract' | 'paycheck'
  results: {
    weeklyGross?: number
    monthlyGross?: number
    totalGross?: number
    netPay?: number
  }
  inputs: Record<string, any>
  style?: any
}) {
  const createCalculationShareData = (): ShareData => {
    const calcUrl = `https://locumtruerate.com/calculator/${type}`
    
    let message = `🧮 LocumTrueRate ${type === 'contract' ? 'Contract' : 'Paycheck'} Calculation\n\n`
    
    if (type === 'contract' && results.totalGross) {
      message += `💵 Total Contract Value: $${results.totalGross.toLocaleString()}\n`
      if (results.weeklyGross) {
        message += `📅 Weekly: $${results.weeklyGross.toLocaleString()}\n`
      }
      if (results.monthlyGross) {
        message += `📆 Monthly: $${results.monthlyGross.toLocaleString()}\n`
      }
    } else if (type === 'paycheck' && results.netPay) {
      message += `💰 Net Pay: $${results.netPay.toLocaleString()}\n`
    }
    
    message += `\nCalculate your own:`
    
    return {
      title: `${type === 'contract' ? 'Contract' : 'Paycheck'} Calculator`,
      message,
      url: calcUrl
    }
  }

  return (
    <ShareButton
      data={createCalculationShareData()}
      style={style}
      icon="🧮"
      label="Share Calculation"
      onShare={() => {
        trackEvent('calculation_shared', {
          calculator_type: type,
          total_value: results.totalGross || results.netPay || 0
        })
      }}
    />
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
})
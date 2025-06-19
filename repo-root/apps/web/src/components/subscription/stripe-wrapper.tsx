'use client'

import React, { ReactNode } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeWrapperProps {
  children: ReactNode
  clientSecret?: string
  options?: {
    mode?: 'payment' | 'subscription' | 'setup'
    currency?: string
    amount?: number
  }
}

export function StripeWrapper({ children, clientSecret, options }: StripeWrapperProps) {
  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1e293b',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
    ...options,
  }

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      {children}
    </Elements>
  )
}
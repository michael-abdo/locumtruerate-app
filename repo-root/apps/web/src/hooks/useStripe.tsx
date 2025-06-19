'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/utils/api'
import { toast } from 'sonner'

export function useStripe() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Mutations
  const createCheckoutSession = api.payments.createSubscriptionCheckout.useMutation()
  const createCustomerPortal = api.payments.createCustomerPortal.useMutation()
  const cancelSubscription = api.payments.cancelSubscription.useMutation()
  const reactivateSubscription = api.payments.reactivateSubscription.useMutation()

  // Handle subscription checkout
  const handleSubscriptionCheckout = useCallback(async (
    priceId: string,
    customerId?: string
  ) => {
    setIsLoading(true)
    
    try {
      const result = await createCheckoutSession.mutateAsync({
        priceId,
        customerId,
        successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/subscription?canceled=true`,
      })

      if (result.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      toast.error('Failed to start checkout process')
    } finally {
      setIsLoading(false)
    }
  }, [createCheckoutSession])

  // Handle customer portal access
  const handleCustomerPortal = useCallback(async (
    customerId: string,
    returnUrl?: string
  ) => {
    setIsLoading(true)
    
    try {
      const result = await createCustomerPortal.mutateAsync({
        customerId,
        returnUrl: returnUrl || `${window.location.origin}/subscription`,
      })

      if (result.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error('Portal access failed:', error)
      toast.error('Failed to access customer portal')
    } finally {
      setIsLoading(false)
    }
  }, [createCustomerPortal])

  // Handle subscription cancellation
  const handleCancelSubscription = useCallback(async (
    subscriptionId: string,
    cancelImmediately = false
  ) => {
    setIsLoading(true)
    
    try {
      await cancelSubscription.mutateAsync({
        subscriptionId,
        cancelImmediately,
      })

      toast.success(
        cancelImmediately 
          ? 'Subscription canceled immediately'
          : 'Subscription will cancel at the end of the billing period'
      )
      
      // Refresh subscription data
      router.refresh()
    } catch (error) {
      console.error('Cancellation failed:', error)
      toast.error('Failed to cancel subscription')
    } finally {
      setIsLoading(false)
    }
  }, [cancelSubscription, router])

  // Handle subscription reactivation
  const handleReactivateSubscription = useCallback(async (subscriptionId: string) => {
    setIsLoading(true)
    
    try {
      await reactivateSubscription.mutateAsync({ subscriptionId })
      
      toast.success('Subscription reactivated successfully')
      
      // Refresh subscription data
      router.refresh()
    } catch (error) {
      console.error('Reactivation failed:', error)
      toast.error('Failed to reactivate subscription')
    } finally {
      setIsLoading(false)
    }
  }, [reactivateSubscription, router])

  return {
    isLoading,
    handleSubscriptionCheckout,
    handleCustomerPortal,
    handleCancelSubscription,
    handleReactivateSubscription,
  }
}
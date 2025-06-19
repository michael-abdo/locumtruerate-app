/**
 * Mobile Payment Provider
 * 
 * Provides optimized payment flows for iOS and Android with Apple Pay and Google Pay
 */

import React, { createContext, useContext, useCallback, useState } from 'react'
import { Platform, Alert } from 'react-native'
import { trpc } from '@/lib/trpc'

// Types for mobile payments
export interface PaymentMethod {
  id: string
  type: 'apple_pay' | 'google_pay' | 'card'
  displayName: string
  brand?: string
  last4?: string
  isDefault: boolean
  canSetAsDefault: boolean
}

export interface PaymentRequest {
  amount: number // in cents
  currency: string
  description: string
  merchantId?: string
  requiredBillingAddressFields?: string[]
  requiredShippingAddressFields?: string[]
  shippingMethods?: ShippingMethod[]
}

export interface ShippingMethod {
  id: string
  label: string
  detail: string
  amount: number
}

export interface PaymentResult {
  success: boolean
  token?: string
  error?: string
  paymentMethod?: PaymentMethod
}

interface MobilePaymentContextType {
  isApplePayAvailable: boolean
  isGooglePayAvailable: boolean
  supportedPaymentMethods: PaymentMethod[]
  initiatePayment: (request: PaymentRequest) => Promise<PaymentResult>
  setupWallet: () => Promise<boolean>
  addPaymentMethod: () => Promise<boolean>
  removePaymentMethod: (methodId: string) => Promise<boolean>
  loading: boolean
}

const MobilePaymentContext = createContext<MobilePaymentContextType | null>(null)

interface MobilePaymentProviderProps {
  children: React.ReactNode
  stripePublishableKey: string
  merchantId?: string
}

export function MobilePaymentProvider({ 
  children, 
  stripePublishableKey, 
  merchantId 
}: MobilePaymentProviderProps) {
  const [loading, setLoading] = useState(false)
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false)
  const [isGooglePayAvailable, setIsGooglePayAvailable] = useState(false)
  const [supportedPaymentMethods, setSupportedPaymentMethods] = useState<PaymentMethod[]>([])

  // Check platform-specific payment availability
  React.useEffect(() => {
    checkPaymentAvailability()
  }, [])

  const checkPaymentAvailability = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        // Check Apple Pay availability
        // Note: This would require react-native-payments or similar library
        // For now, we'll simulate the check
        const applePaySupported = await checkApplePaySupport()
        setIsApplePayAvailable(applePaySupported)
      } else if (Platform.OS === 'android') {
        // Check Google Pay availability
        const googlePaySupported = await checkGooglePaySupport()
        setIsGooglePayAvailable(googlePaySupported)
      }

      // Load saved payment methods
      await loadPaymentMethods()
    } catch (error) {
      console.error('Failed to check payment availability:', error)
    }
  }, [])

  const checkApplePaySupport = async (): Promise<boolean> => {
    try {
      // This would integrate with react-native-payments or @stripe/stripe-react-native
      // return await ApplePay.canMakePayments()
      
      // Simulate Apple Pay check
      return Platform.OS === 'ios' && parseFloat(Platform.Version) >= 9.0
    } catch (error) {
      console.error('Apple Pay check failed:', error)
      return false
    }
  }

  const checkGooglePaySupport = async (): Promise<boolean> => {
    try {
      // This would integrate with react-native-google-pay or similar
      // return await GooglePay.isReadyToPay()
      
      // Simulate Google Pay check
      return Platform.OS === 'android' && parseInt(Platform.Version, 10) >= 19
    } catch (error) {
      console.error('Google Pay check failed:', error)
      return false
    }
  }

  const loadPaymentMethods = async () => {
    try {
      const methods: PaymentMethod[] = []
      
      // Add platform-specific payment methods
      if (isApplePayAvailable) {
        methods.push({
          id: 'apple_pay',
          type: 'apple_pay',
          displayName: 'Apple Pay',
          isDefault: true,
          canSetAsDefault: false,
        })
      }

      if (isGooglePayAvailable) {
        methods.push({
          id: 'google_pay',
          type: 'google_pay',
          displayName: 'Google Pay',
          isDefault: true,
          canSetAsDefault: false,
        })
      }

      // Add card payment option
      methods.push({
        id: 'add_card',
        type: 'card',
        displayName: 'Add Credit Card',
        isDefault: false,
        canSetAsDefault: true,
      })

      setSupportedPaymentMethods(methods)
    } catch (error) {
      console.error('Failed to load payment methods:', error)
    }
  }

  const initiatePayment = useCallback(async (request: PaymentRequest): Promise<PaymentResult> => {
    setLoading(true)
    
    try {
      // Handle Apple Pay
      if (Platform.OS === 'ios' && isApplePayAvailable) {
        return await initiateApplePay(request)
      }
      
      // Handle Google Pay
      if (Platform.OS === 'android' && isGooglePayAvailable) {
        return await initiateGooglePay(request)
      }
      
      // Fallback to card payment
      return await initiateCardPayment(request)
    } catch (error) {
      console.error('Payment initiation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      }
    } finally {
      setLoading(false)
    }
  }, [isApplePayAvailable, isGooglePayAvailable])

  const initiateApplePay = async (request: PaymentRequest): Promise<PaymentResult> => {
    try {
      // This would integrate with Apple Pay
      // const paymentRequest = {
      //   merchantIdentifier: merchantId || 'merchant.com.locumtruerate.app',
      //   supportedNetworks: ['visa', 'mastercard', 'amex'],
      //   merchantCapabilities: ['3DS'],
      //   paymentSummaryItems: [
      //     {
      //       label: request.description,
      //       amount: (request.amount / 100).toFixed(2),
      //     },
      //   ],
      // }
      
      // const token = await ApplePay.presentPaymentRequest(paymentRequest)
      
      // Simulate Apple Pay success
      return {
        success: true,
        token: 'apple_pay_token_' + Date.now(),
        paymentMethod: {
          id: 'apple_pay',
          type: 'apple_pay',
          displayName: 'Apple Pay',
          isDefault: true,
          canSetAsDefault: false,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: 'Apple Pay was cancelled or failed',
      }
    }
  }

  const initiateGooglePay = async (request: PaymentRequest): Promise<PaymentResult> => {
    try {
      // This would integrate with Google Pay
      // const paymentRequest = {
      //   apiVersion: 2,
      //   apiVersionMinor: 0,
      //   allowedPaymentMethods: [
      //     {
      //       type: 'CARD',
      //       parameters: {
      //         allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
      //         allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA'],
      //       },
      //       tokenizationSpecification: {
      //         type: 'PAYMENT_GATEWAY',
      //         parameters: {
      //           gateway: 'stripe',
      //           gatewayMerchantId: merchantId,
      //         },
      //       },
      //     },
      //   ],
      //   transactionInfo: {
      //     totalPriceStatus: 'FINAL',
      //     totalPrice: (request.amount / 100).toFixed(2),
      //     currencyCode: request.currency.toUpperCase(),
      //   },
      // }
      
      // const token = await GooglePay.requestPayment(paymentRequest)
      
      // Simulate Google Pay success
      return {
        success: true,
        token: 'google_pay_token_' + Date.now(),
        paymentMethod: {
          id: 'google_pay',
          type: 'google_pay',
          displayName: 'Google Pay',
          isDefault: true,
          canSetAsDefault: false,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: 'Google Pay was cancelled or failed',
      }
    }
  }

  const initiateCardPayment = async (request: PaymentRequest): Promise<PaymentResult> => {
    try {
      // This would integrate with Stripe's mobile SDK for card input
      // For now, show an alert that this would open a card input form
      
      return new Promise((resolve) => {
        Alert.alert(
          'Card Payment',
          'This would open a secure card input form',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve({
                success: false,
                error: 'Payment cancelled',
              }),
            },
            {
              text: 'Continue',
              onPress: () => resolve({
                success: true,
                token: 'card_token_' + Date.now(),
                paymentMethod: {
                  id: 'card_' + Date.now(),
                  type: 'card',
                  displayName: 'Visa ****1234',
                  brand: 'visa',
                  last4: '1234',
                  isDefault: false,
                  canSetAsDefault: true,
                },
              }),
            },
          ]
        )
      })
    } catch (error) {
      return {
        success: false,
        error: 'Card payment failed',
      }
    }
  }

  const setupWallet = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        // Guide user to set up Apple Pay in Wallet app
        Alert.alert(
          'Set Up Apple Pay',
          'To use Apple Pay, please add a payment method in the Wallet app.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Wallet', onPress: () => {
              // This would open the Wallet app
              // Linking.openURL('shoebox://') 
            }},
          ]
        )
      } else if (Platform.OS === 'android') {
        // Guide user to set up Google Pay
        Alert.alert(
          'Set Up Google Pay',
          'To use Google Pay, please add a payment method in the Google Pay app.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Google Pay', onPress: () => {
              // This would open Google Pay
              // Linking.openURL('https://pay.google.com/') 
            }},
          ]
        )
      }
      
      return true
    } catch (error) {
      console.error('Setup wallet failed:', error)
      return false
    }
  }, [])

  const addPaymentMethod = useCallback(async (): Promise<boolean> => {
    try {
      // This would open a card input form or wallet setup
      Alert.alert(
        'Add Payment Method',
        'This would open a secure form to add a new payment method.',
        [{ text: 'OK' }]
      )
      return true
    } catch (error) {
      console.error('Add payment method failed:', error)
      return false
    }
  }, [])

  const removePaymentMethod = useCallback(async (methodId: string): Promise<boolean> => {
    try {
      // This would remove the payment method
      setSupportedPaymentMethods(prev => prev.filter(method => method.id !== methodId))
      return true
    } catch (error) {
      console.error('Remove payment method failed:', error)
      return false
    }
  }, [])

  const value: MobilePaymentContextType = {
    isApplePayAvailable,
    isGooglePayAvailable,
    supportedPaymentMethods,
    initiatePayment,
    setupWallet,
    addPaymentMethod,
    removePaymentMethod,
    loading,
  }

  return (
    <MobilePaymentContext.Provider value={value}>
      {children}
    </MobilePaymentContext.Provider>
  )
}

export function useMobilePayments() {
  const context = useContext(MobilePaymentContext)
  if (!context) {
    throw new Error('useMobilePayments must be used within a MobilePaymentProvider')
  }
  return context
}

/**
 * Hook for subscription payments with mobile optimization
 */
export function useSubscriptionPayment() {
  const { initiatePayment, loading } = useMobilePayments()
  const subscriptionMutation = trpc.payments.createSubscriptionCheckout.useMutation()

  const startSubscriptionPayment = useCallback(async (
    planId: string,
    isYearly: boolean = false
  ) => {
    try {
      // For mobile, we'll use the payment sheet approach
      const result = await initiatePayment({
        amount: isYearly ? (planId === 'pro' ? 299000 : 699000) : (planId === 'pro' ? 29900 : 69900),
        currency: 'usd',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Subscription${isYearly ? ' (Yearly)' : ''}`,
      })

      if (result.success) {
        // Handle successful payment
        console.log('Subscription payment successful:', result)
        return result
      } else {
        throw new Error(result.error || 'Payment failed')
      }
    } catch (error) {
      console.error('Subscription payment failed:', error)
      throw error
    }
  }, [initiatePayment])

  return {
    startSubscriptionPayment,
    loading: loading || subscriptionMutation.isLoading,
  }
}
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider } from '@react-navigation/native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useEffect } from 'react'
import { View } from 'react-native'
import { Analytics } from '../src/services/analytics'
import { initializeOffline } from '../src/lib/offline'
import { initializeAuth } from '../src/lib/auth'
import { DeepLinking } from '../src/lib/deepLinking'
import { OfflineIndicator } from '../src/components/OfflineIndicator'

export default function RootLayout() {
  useEffect(() => {
    // Initialize analytics and crash reporting
    Analytics.initialize().then(() => {
      console.log('Analytics initialized')
    }).catch((error) => {
      console.error('Failed to initialize analytics:', error)
    })

    // Initialize offline functionality
    initializeOffline().then(() => {
      console.log('Offline functionality initialized')
    }).catch((error) => {
      console.error('Failed to initialize offline functionality:', error)
    })

    // Initialize authentication
    initializeAuth().then(() => {
      console.log('Authentication initialized')
    }).catch((error) => {
      console.error('Failed to initialize authentication:', error)
    })

    // Initialize deep linking
    DeepLinking.initialize().then(() => {
      console.log('Deep linking initialized')
    }).catch((error) => {
      console.error('Failed to initialize deep linking:', error)
    })

    // Set up app lifecycle tracking
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        Analytics.trackEvent('app_foregrounded')
      } else if (nextAppState === 'background') {
        Analytics.trackEvent('app_backgrounded')
      }
    }

    // Track app lifecycle
    const { AppState } = require('react-native')
    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription?.remove()
    }
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={{ dark: false, colors: { primary: '#2563eb', background: '#ffffff', card: '#ffffff', text: '#000000', border: '#e5e7eb', notification: '#2563eb' } }}>
          <View style={{ flex: 1 }}>
            <OfflineIndicator />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2563eb',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="index" 
              options={{ 
                title: 'LocumTrueRate',
                headerShown: false
              }} 
            />
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false 
              }} 
            />
            <Stack.Screen 
              name="calculator/[type]" 
              options={{ 
                title: 'Calculator',
                presentation: 'modal'
              }} 
            />
            <Stack.Screen 
              name="job/[id]" 
              options={{ 
                title: 'Job Details'
              }} 
            />
          </Stack>
          <StatusBar style="light" />
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
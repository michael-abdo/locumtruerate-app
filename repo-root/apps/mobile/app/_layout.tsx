import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider } from '@react-navigation/native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={{ dark: false, colors: { primary: '#2563eb', background: '#ffffff', card: '#ffffff', text: '#000000', border: '#e5e7eb', notification: '#2563eb' } }}>
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
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
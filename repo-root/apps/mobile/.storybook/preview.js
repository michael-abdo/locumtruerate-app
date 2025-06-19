import { View } from 'react-native'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  viewport: {
    viewports: {
      mobile1: {
        name: 'iPhone 12',
        styles: {
          width: '390px',
          height: '844px',
        },
      },
      mobile2: {
        name: 'iPhone 12 Pro Max',
        styles: {
          width: '428px',
          height: '926px',
        },
      },
      tablet: {
        name: 'iPad Pro',
        styles: {
          width: '1024px',
          height: '1366px',
        },
      },
    },
    defaultViewport: 'mobile1',
  },
  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: '#f8fafc',
      },
      {
        name: 'dark',
        value: '#1e293b',
      },
      {
        name: 'white',
        value: '#ffffff',
      },
    ],
  },
}

// Global decorator to provide consistent styling
export const decorators = [
  (Story) => (
    <View style={{ 
      flex: 1, 
      padding: 16, 
      backgroundColor: '#f8fafc',
      minHeight: '100vh' 
    }}>
      <Story />
    </View>
  ),
]
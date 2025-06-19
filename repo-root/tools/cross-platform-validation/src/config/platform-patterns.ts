import type { PlatformPatterns } from '../types/validation-types';

/**
 * Platform-specific patterns for detecting web vs React Native code
 */
export const DEFAULT_PLATFORM_PATTERNS: PlatformPatterns = {
  web: {
    imports: [
      'react-dom',
      'react-dom/client',
      'next/',
      'next/router',
      'next/navigation',
      'react-router',
      'react-router-dom',
      '@emotion/react',
      '@emotion/styled',
      'styled-components',
      'css-modules',
      'webpack',
      'vite'
    ],
    apis: [
      'document',
      'window',
      'localStorage',
      'sessionStorage',
      'fetch',
      'XMLHttpRequest',
      'navigator.geolocation',
      'navigator.userAgent',
      'location.href',
      'history.pushState',
      'addEventListener',
      'removeEventListener',
      'querySelector',
      'getElementById',
      'createElement',
      'innerHTML',
      'outerHTML',
      'textContent'
    ],
    patterns: [
      /className\s*=\s*["'`]/,
      /\.css["'`]/,
      /\.scss["'`]/,
      /\.module\.css["'`]/,
      /style\s*=\s*\{\{/,
      /document\./,
      /window\./,
      /localStorage\./,
      /sessionStorage\./,
      /<div[^>]*>/,
      /<span[^>]*>/,
      /<img[^>]*>/,
      /<a[^>]*href/,
      /<form[^>]*>/,
      /<input[^>]*>/,
      /<button[^>]*>/,
      /onClick\s*=/,
      /onChange\s*=/,
      /onSubmit\s*=/,
      /href\s*=/,
      /target\s*=\s*["']_blank["']/
    ]
  },

  native: {
    imports: [
      'react-native',
      'react-native/',
      '@react-native/',
      '@react-navigation/',
      'react-navigation',
      '@expo/',
      'expo',
      'expo-',
      '@react-native-community/',
      '@react-native-async-storage/',
      'react-native-vector-icons',
      'react-native-svg',
      'react-native-reanimated',
      'react-native-gesture-handler',
      'react-native-safe-area-context'
    ],
    apis: [
      'AsyncStorage',
      'StyleSheet.create',
      'Dimensions.get',
      'Platform.OS',
      'Platform.select',
      'Alert.alert',
      'Linking.openURL',
      'PermissionsAndroid',
      'BackHandler',
      'AppState',
      'DeviceInfo',
      'CameraRoll',
      'PushNotificationIOS',
      'NetInfo'
    ],
    patterns: [
      /StyleSheet\.create/,
      /Platform\.OS/,
      /Platform\.select/,
      /AsyncStorage\./,
      /Dimensions\.get/,
      /Alert\.alert/,
      /from\s+['"]react-native['"]/,
      /<View[^>]*>/,
      /<Text[^>]*>/,
      /<ScrollView[^>]*>/,
      /<TouchableOpacity[^>]*>/,
      /<TouchableHighlight[^>]*>/,
      /<FlatList[^>]*>/,
      /<SectionList[^>]*>/,
      /<Image[^>]*source/,
      /onPress\s*=/,
      /style\s*=\s*\[/,
      /style\s*=\s*styles\./,
      /flexDirection:/,
      /justifyContent:/,
      /alignItems:/
    ]
  },

  shared: {
    imports: [
      'react',
      'react/jsx-runtime',
      '@types/react',
      'typescript',
      'zod',
      'date-fns',
      'lodash',
      'ramda',
      'axios',
      'uuid',
      'nanoid',
      'crypto-js',
      '@locumtruerate/',
      '../',
      './',
      'utils/',
      'types/',
      'constants/',
      'hooks/',
      'contexts/'
    ],
    apis: [
      'useState',
      'useEffect',
      'useCallback',
      'useMemo',
      'useContext',
      'useReducer',
      'useRef',
      'useLayoutEffect',
      'useImperativeHandle',
      'useDebugValue',
      'createContext',
      'forwardRef',
      'memo',
      'lazy',
      'Suspense',
      'Fragment',
      'StrictMode',
      'console.log',
      'console.error',
      'console.warn',
      'JSON.parse',
      'JSON.stringify',
      'parseInt',
      'parseFloat',
      'setTimeout',
      'setInterval',
      'clearTimeout',
      'clearInterval',
      'Promise',
      'async',
      'await'
    ],
    patterns: [
      /^import\s+React/,
      /useState\s*\(/,
      /useEffect\s*\(/,
      /useCallback\s*\(/,
      /useMemo\s*\(/,
      /useContext\s*\(/,
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /export\s+(interface|type|const|function)/,
      /\/\*\*[\s\S]*?\*\//,
      /\/\/.*$/m,
      /const\s+\w+\s*=/,
      /function\s+\w+/,
      /=>\s*\{/,
      /\.map\s*\(/,
      /\.filter\s*\(/,
      /\.reduce\s*\(/,
      /\.find\s*\(/,
      /\.forEach\s*\(/,
      /try\s*\{/,
      /catch\s*\(/,
      /finally\s*\{/
    ]
  }
};

/**
 * Configuration for code reuse analysis
 */
export const DEFAULT_VALIDATION_CONFIG = {
  targetReusePercentage: 85,
  excludePatterns: [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**'
  ],
  includePatterns: [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx'
  ],
  platformPatterns: DEFAULT_PLATFORM_PATTERNS
};

/**
 * Scoring weights for different types of platform-specific code
 */
export const PLATFORM_SCORING_WEIGHTS = {
  imports: 1.0,        // Full weight for imports
  apis: 0.8,          // High weight for API calls
  patterns: 0.6,      // Medium weight for patterns
  comments: 0.1       // Low weight for comments
};

/**
 * Complexity scoring thresholds
 */
export const COMPLEXITY_THRESHOLDS = {
  cyclomaticComplexity: {
    low: 5,
    medium: 10,
    high: 20
  },
  cognitiveComplexity: {
    low: 10,
    medium: 20,
    high: 40
  },
  dependencies: {
    low: 5,
    medium: 10,
    high: 20
  }
};
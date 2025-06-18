# Design System Foundation for Mobile-First Development

## Executive Summary

This document establishes a comprehensive design system foundation for Week 3+ development, ensuring consistent, mobile-first components with cross-platform compatibility and seamless integration with the calc-core package.

## Design System Architecture

### Core Principles
1. **Mobile-First**: Every component designed for mobile, enhanced for desktop
2. **Cross-Platform**: 85%+ code reuse between web and React Native
3. **Accessibility**: WCAG 2.1 AA compliance by default
4. **Performance**: Optimized for slow networks and low-end devices
5. **Consistency**: Unified visual language across all components

### Design Token Structure

#### Color System
```typescript
// src/design-system/tokens/colors.ts
export const colorTokens = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    500: '#3b82f6',  // Main brand blue
    600: '#2563eb',
    900: '#1e3a8a'
  },
  
  // Semantic Colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a'
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626'
  },
  
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706'
  },
  
  // Neutral Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  
  // Calculator-specific Colors
  calculator: {
    background: '#ffffff',
    surface: '#f8fafc',
    border: '#e2e8f0',
    inputBackground: '#ffffff',
    inputBorder: '#cbd5e1',
    inputFocus: '#3b82f6',
    resultBackground: '#f1f5f9',
    resultAccent: '#0ea5e9'
  }
} as const;

// Cross-platform color abstraction
export const platformColors = {
  web: colorTokens,
  native: {
    ...colorTokens,
    // React Native specific overrides
    calculator: {
      ...colorTokens.calculator,
      inputBackground: '#fafafa', // Slightly different for native
    }
  }
};
```

#### Typography Scale
```typescript
// src/design-system/tokens/typography.ts
export const typographyTokens = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'Monaco', 'monospace'],
    calculator: ['SF Pro Display', 'Inter', 'system-ui'] // Better for numbers
  },
  
  // Font Sizes (Mobile-first with desktop scales)
  fontSize: {
    xs: { mobile: '12px', desktop: '12px' },
    sm: { mobile: '14px', desktop: '14px' },
    base: { mobile: '16px', desktop: '16px' }, // Base for mobile readability
    lg: { mobile: '18px', desktop: '18px' },
    xl: { mobile: '20px', desktop: '20px' },
    '2xl': { mobile: '24px', desktop: '24px' },
    '3xl': { mobile: '30px', desktop: '30px' },
    '4xl': { mobile: '36px', desktop: '36px' },
    
    // Calculator-specific sizes
    calculatorInput: { mobile: '18px', desktop: '16px' },
    calculatorResult: { mobile: '24px', desktop: '20px' },
    calculatorDisplay: { mobile: '32px', desktop: '28px' }
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2
  },
  
  // Font Weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
} as const;
```

#### Spacing System
```typescript
// src/design-system/tokens/spacing.ts
export const spacingTokens = {
  // Base spacing scale (4px base unit)
  0: '0',
  1: '4px',   // 0.25rem
  2: '8px',   // 0.5rem  
  3: '12px',  // 0.75rem
  4: '16px',  // 1rem
  5: '20px',  // 1.25rem
  6: '24px',  // 1.5rem
  8: '32px',  // 2rem
  10: '40px', // 2.5rem
  12: '48px', // 3rem
  16: '64px', // 4rem
  20: '80px', // 5rem
  
  // Touch Target Sizes (Mobile-optimized)
  touchTarget: {
    minimum: '44px',    // WCAG minimum
    comfortable: '48px', // Recommended
    large: '56px'       // Prominent actions
  },
  
  // Container Spacing
  container: {
    mobile: '16px',
    tablet: '24px', 
    desktop: '32px'
  },
  
  // Calculator-specific spacing
  calculator: {
    padding: '16px',
    gap: '12px',
    buttonGap: '8px',
    sectionGap: '24px'
  }
} as const;
```

### Component Design Tokens

#### Button System
```typescript
// src/design-system/components/button/tokens.ts
export const buttonTokens = {
  // Size variants
  size: {
    sm: {
      height: '36px',
      padding: '8px 12px',
      fontSize: 'sm',
      borderRadius: '6px'
    },
    md: {
      height: '44px',  // Touch-friendly
      padding: '12px 16px',
      fontSize: 'base',
      borderRadius: '8px'
    },
    lg: {
      height: '52px',
      padding: '16px 24px', 
      fontSize: 'lg',
      borderRadius: '10px'
    }
  },
  
  // Variant styles
  variant: {
    primary: {
      backgroundColor: 'primary.500',
      color: 'white',
      border: 'none',
      hover: {
        backgroundColor: 'primary.600'
      },
      active: {
        backgroundColor: 'primary.700'
      }
    },
    
    secondary: {
      backgroundColor: 'transparent',
      color: 'primary.500',
      border: '1px solid',
      borderColor: 'primary.500',
      hover: {
        backgroundColor: 'primary.50'
      }
    },
    
    calculator: {
      backgroundColor: 'calculator.surface',
      color: 'gray.800',
      border: '1px solid',
      borderColor: 'calculator.border',
      hover: {
        backgroundColor: 'gray.50'
      },
      active: {
        backgroundColor: 'gray.100'
      }
    }
  }
} as const;
```

#### Input System
```typescript
// src/design-system/components/input/tokens.ts
export const inputTokens = {
  // Base input styles
  base: {
    height: '44px', // Touch-friendly
    padding: '12px 16px',
    fontSize: 'base',
    borderRadius: '8px',
    border: '1px solid',
    borderColor: 'gray.300',
    backgroundColor: 'white',
    
    focus: {
      borderColor: 'primary.500',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
      outline: 'none'
    },
    
    error: {
      borderColor: 'error.500',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
    },
    
    disabled: {
      backgroundColor: 'gray.50',
      color: 'gray.400',
      cursor: 'not-allowed'
    }
  },
  
  // Calculator-specific inputs
  calculator: {
    currency: {
      paddingLeft: '40px', // Space for $ symbol
      textAlign: 'right',
      fontSize: 'calculatorInput',
      fontFamily: 'calculator'
    },
    
    percentage: {
      paddingRight: '40px', // Space for % symbol
      textAlign: 'center',
      fontSize: 'calculatorInput'
    },
    
    number: {
      textAlign: 'right',
      fontSize: 'calculatorInput',
      fontFamily: 'calculator'
    }
  }
} as const;
```

### Mobile-First Responsive System

#### Breakpoint Strategy
```typescript
// src/design-system/tokens/breakpoints.ts
export const breakpoints = {
  // Mobile-first approach
  mobile: '0px',      // Default, no media query needed
  tablet: '768px',    // iPad and larger
  desktop: '1024px',  // Desktop and larger
  wide: '1280px',     // Wide desktop
  
  // Calculator-specific breakpoints
  calculatorCompact: '480px', // Switch to compact layout
  calculatorExpanded: '640px' // Full calculator features
} as const;

// Responsive utilities
export const responsive = {
  mobile: (styles: any) => styles,
  tablet: (styles: any) => ({
    [`@media (min-width: ${breakpoints.tablet})`]: styles
  }),
  desktop: (styles: any) => ({
    [`@media (min-width: ${breakpoints.desktop})`]: styles
  })
};
```

#### Grid System
```typescript
// src/design-system/layout/grid.ts
export const gridTokens = {
  // Mobile-first grid
  container: {
    mobile: {
      maxWidth: '100%',
      padding: '16px'
    },
    tablet: {
      maxWidth: '768px',
      padding: '24px',
      margin: '0 auto'
    },
    desktop: {
      maxWidth: '1200px',
      padding: '32px',
      margin: '0 auto'
    }
  },
  
  // Calculator layout grid
  calculator: {
    mobile: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '24px'
    },
    tablet: {
      gridTemplateColumns: '1fr 1fr',
      gap: '32px'
    },
    desktop: {
      gridTemplateColumns: '2fr 1fr',
      gap: '40px'
    }
  }
} as const;
```

## Component Library Structure

### File Organization
```
src/design-system/
├── tokens/                 # Design tokens
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── breakpoints.ts
│   └── index.ts
├── components/            # Base components
│   ├── button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.stories.tsx
│   │   └── tokens.ts
│   ├── input/
│   │   ├── Input.tsx
│   │   ├── Input.test.tsx
│   │   ├── Input.stories.tsx
│   │   └── tokens.ts
│   └── index.ts
├── calculator/            # Calculator-specific components
│   ├── CalculatorInput/
│   ├── CalculatorButton/
│   ├── CalculatorResult/
│   └── index.ts
├── layout/               # Layout components
│   ├── Container/
│   ├── Grid/
│   ├── Stack/
│   └── index.ts
├── utils/                # Design system utilities
│   ├── responsive.ts
│   ├── theme.ts
│   └── index.ts
└── index.ts              # Main export
```

### Cross-Platform Component Pattern
```typescript
// src/design-system/components/button/Button.tsx
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { buttonTokens } from './tokens';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'calculator';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onPress,
  disabled = false
}) => {
  const styles = getButtonStyles(variant, size, disabled);
  
  // Platform-specific rendering
  if (Platform.OS === 'web') {
    return (
      <button
        className={styles.className}
        onClick={onPress}
        disabled={disabled}
        style={styles.style}
      >
        {children}
      </button>
    );
  }
  
  return (
    <TouchableOpacity
      style={[styles.base, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
};

// Style generation for cross-platform use
const getButtonStyles = (variant: string, size: string, disabled: boolean) => {
  const variantStyles = buttonTokens.variant[variant];
  const sizeStyles = buttonTokens.size[size];
  
  return Platform.select({
    web: {
      className: `btn btn-${variant} btn-${size}`,
      style: {
        ...variantStyles,
        ...sizeStyles,
        ...(disabled && { opacity: 0.5 })
      }
    },
    default: {
      base: StyleSheet.create({
        button: {
          ...variantStyles,
          ...sizeStyles,
          alignItems: 'center',
          justifyContent: 'center'
        }
      }).button,
      disabled: { opacity: 0.5 },
      text: { color: variantStyles.color }
    }
  });
};
```

## Development Workflow Setup

### 1. Component Development Process
```bash
# 1. Create component directory
mkdir src/design-system/components/NewComponent

# 2. Generate component files
npx plop component NewComponent

# 3. Implement component with mobile-first approach
# - Start with mobile layout
# - Add tablet enhancements
# - Add desktop optimizations

# 4. Test across platforms
npm run test:component NewComponent
npm run test:mobile NewComponent
npm run test:web NewComponent

# 5. Document and showcase
npm run storybook:build
```

### 2. Design Token Updates
```bash
# 1. Update design tokens
edit src/design-system/tokens/colors.ts

# 2. Regenerate CSS custom properties
npm run tokens:generate

# 3. Update component styles
npm run components:update

# 4. Test visual regression
npm run test:visual
```

### 3. Cross-Platform Validation
```bash
# 1. Web validation
npm run build:web
npm run test:web:e2e

# 2. React Native validation  
npm run build:mobile
npm run test:mobile:e2e

# 3. Component compatibility check
npm run test:cross-platform
```

## Theming Architecture

### Theme Provider Setup
```typescript
// src/design-system/theme/ThemeProvider.tsx
import React, { createContext, useContext } from 'react';
import { colorTokens, typographyTokens, spacingTokens } from '../tokens';

interface Theme {
  colors: typeof colorTokens;
  typography: typeof typographyTokens;
  spacing: typeof spacingTokens;
  mode: 'light' | 'dark';
}

const ThemeContext = createContext<Theme | null>(null);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  mode?: 'light' | 'dark';
}> = ({ children, mode = 'light' }) => {
  const theme: Theme = {
    colors: mode === 'dark' ? darkColorTokens : colorTokens,
    typography: typographyTokens,
    spacing: spacingTokens,
    mode
  };
  
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
};
```

### CSS Custom Properties Generation
```typescript
// src/design-system/utils/generateCSS.ts
export const generateCSSCustomProperties = (tokens: any) => {
  let css = ':root {\n';
  
  const flattenTokens = (obj: any, prefix = '') => {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const cssVar = `--${prefix}${prefix ? '-' : ''}${key}`;
      
      if (typeof value === 'object' && value !== null) {
        flattenTokens(value, `${prefix}${prefix ? '-' : ''}${key}`);
      } else {
        css += `  ${cssVar}: ${value};\n`;
      }
    });
  };
  
  flattenTokens(tokens);
  css += '}\n';
  
  return css;
};
```

## Calculator-Specific Design System

### Calculator Component Tokens
```typescript
// src/design-system/calculator/tokens.ts
export const calculatorTokens = {
  layout: {
    mobile: {
      padding: '16px',
      gap: '16px',
      columns: 1
    },
    tablet: {
      padding: '24px',
      gap: '24px', 
      columns: 2
    },
    desktop: {
      padding: '32px',
      gap: '32px',
      columns: '2fr 1fr'
    }
  },
  
  input: {
    height: '56px', // Larger for calculator
    fontSize: '18px',
    fontFamily: 'calculator',
    textAlign: 'right',
    padding: '16px',
    borderRadius: '12px'
  },
  
  result: {
    backgroundColor: 'calculator.resultBackground',
    padding: '24px',
    borderRadius: '16px',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'calculator.resultAccent'
  },
  
  button: {
    height: '48px',
    fontSize: '16px',
    fontWeight: 'medium',
    borderRadius: '8px',
    minTouchTarget: '44px'
  }
} as const;
```

### Responsive Calculator Layout
```typescript
// src/design-system/calculator/CalculatorLayout.tsx
import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { calculatorTokens } from './tokens';

interface CalculatorLayoutProps {
  inputs: React.ReactNode;
  results: React.ReactNode;
  actions?: React.ReactNode;
}

export const CalculatorLayout: React.FC<CalculatorLayoutProps> = ({
  inputs,
  results,
  actions
}) => {
  const theme = useTheme();
  
  return (
    <div className="calculator-layout">
      {/* Mobile: Stacked layout */}
      <div className="mobile-layout md:hidden">
        <div className="calculator-results">{results}</div>
        <div className="calculator-inputs">{inputs}</div>
        {actions && <div className="calculator-actions">{actions}</div>}
      </div>
      
      {/* Desktop: Side-by-side layout */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="calculator-inputs">{inputs}</div>
        <div className="calculator-results-sidebar">
          {results}
          {actions}
        </div>
      </div>
    </div>
  );
};
```

## Implementation Checklist

### Phase 1: Foundation Setup (Day 1)
- [ ] Create design system directory structure
- [ ] Implement core design tokens
- [ ] Set up theme provider
- [ ] Create basic component templates

### Phase 2: Base Components (Day 2-3)
- [ ] Button component with calculator variant
- [ ] Input component with currency/percentage types
- [ ] Typography components
- [ ] Layout components (Container, Grid, Stack)

### Phase 3: Calculator Components (Day 4-5)
- [ ] CalculatorInput with formatting
- [ ] CalculatorResult display
- [ ] CalculatorLayout responsive wrapper
- [ ] CalculatorButton specialized buttons

### Phase 4: Integration & Testing (Day 6-7)
- [ ] Cross-platform component testing
- [ ] Visual regression testing
- [ ] Performance optimization
- [ ] Documentation and examples

## Success Metrics

### Design Consistency
- [ ] All components use design tokens
- [ ] Consistent spacing and typography
- [ ] Unified color palette usage
- [ ] Proper responsive behavior

### Cross-Platform Compatibility
- [ ] 85%+ code reuse between platforms
- [ ] Consistent visual appearance
- [ ] Platform-appropriate interactions
- [ ] Performance within targets

### Developer Experience
- [ ] Clear component documentation
- [ ] Easy-to-use APIs
- [ ] Good TypeScript support
- [ ] Helpful error messages

### User Experience
- [ ] Touch-friendly on mobile
- [ ] Accessible on all platforms
- [ ] Fast loading and interactions
- [ ] Intuitive calculator workflows

## Conclusion

This design system foundation provides:
1. **Consistent Visual Language**: Unified tokens and components
2. **Mobile-First Approach**: Optimized for mobile, enhanced for desktop
3. **Cross-Platform Ready**: 85%+ code reuse capability
4. **Calculator-Optimized**: Specialized components for financial calculations
5. **Developer Friendly**: Clear patterns and documentation

Ready for Week 3 True Rate Calculator development with a solid, scalable foundation.
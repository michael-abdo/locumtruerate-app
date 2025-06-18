/**
 * Mixed Platform Test Component
 * 
 * This component is designed to test the analyzer's detection of mixed platform patterns.
 * It represents a component that has both web and React Native specific code, simulating
 * a real-world scenario during cross-platform migration or abstraction.
 * 
 * Expected Pattern Counts:
 * - Web patterns: 5 occurrences
 *   - className patterns: 3 occurrences
 *   - onClick patterns: 1 occurrence
 *   - Web HTML elements: 1 occurrence
 * - Native patterns: 3 occurrences
 *   - StyleSheet.create patterns: 1 occurrence
 *   - Platform.OS patterns: 1 occurrence
 *   - React Native component patterns: 1 occurrence
 * - Shared patterns: 15+ occurrences (React hooks, functions, etc.)
 * 
 * Total Expected Platform Patterns: 8 (5 web + 3 native)
 * Expected Reusability: ~65-75% (mixed platform code with shared logic)
 */

import React, { useState, useEffect, useCallback } from 'react';

// Conditional imports based on platform detection
// In a real-world scenario, this might be handled by bundlers or platform-specific builds
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
const isReactNative = !isWeb;

// Mock imports for demonstration (in real code, these would be conditional)
let StyleSheet: any, Platform: any, View: any;

if (isReactNative) {
  // These would be real imports in React Native environment
  StyleSheet = { create: (styles: any) => styles };
  Platform = { OS: 'android' };
  View = 'View';
}

interface MixedComponentProps {
  title: string;
  content: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export function MixedPlatformComponent({ 
  title, 
  content, 
  onPress, 
  variant = 'primary',
  disabled = false 
}: MixedComponentProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [toast, setToast] = useState<ToastConfig | null>(null);

  // Shared business logic (cross-platform)
  const handleInteraction = useCallback(() => {
    if (disabled) return;
    
    if (onPress) {
      onPress();
    }
    
    showToast({
      message: 'Action completed successfully',
      type: 'success',
      duration: 3000
    });
  }, [onPress, disabled]);

  // Platform-specific toast implementation
  const showToast = useCallback((config: ToastConfig) => {
    setToast(config);
    
    if (isReactNative && Platform.OS === 'android') { // Platform.OS pattern 1 (Native)
      // React Native Android-specific toast logic
      setTimeout(() => setToast(null), config.duration || 3000);
    } else {
      // Web or iOS fallback
      setTimeout(() => setToast(null), config.duration || 2000);
    }
  }, []);

  // Effect for platform-specific initialization
  useEffect(() => {
    if (isWeb) {
      // Web-specific initialization
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsVisible(false);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // Platform-specific rendering helper
  const renderPlatformSpecificContent = () => {
    if (isReactNative) {
      // React Native rendering with StyleSheet
      return React.createElement(View, { // React Native component pattern 1 (Native)
        style: nativeStyles.container
      }, [
        React.createElement('Text', { key: 'title', style: nativeStyles.title }, title),
        React.createElement('Text', { key: 'content', style: nativeStyles.content }, content)
      ]);
    } else {
      // Web rendering with CSS classes
      return (
        <div className="mixed-component-container"> {/* className pattern 1 (Web) */}
          <h3 className="mixed-component-title">{title}</h3> {/* className pattern 2 (Web) */}
          <p className="mixed-component-content">{content}</p> {/* className pattern 3 (Web) */}
        </div>
      );
    }
  };

  // Toast rendering
  const renderToast = () => {
    if (!toast) return null;

    const toastClass = `toast toast-${toast.type}`;
    
    if (isWeb) {
      return (
        <div className={toastClass} style={{ position: 'fixed', top: '20px', right: '20px' }}> {/* Web HTML element pattern 1 (Web) */}
          {toast.message}
        </div>
      );
    } else {
      // React Native toast would use different components
      return React.createElement(View, {
        style: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: '#333' }
      }, toast.message);
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Platform-specific content */}
      {renderPlatformSpecificContent()}
      
      {/* Shared interaction button */}
      <button
        onClick={handleInteraction} {/* onClick pattern 1 (Web) */}
        disabled={disabled}
        style={{
          padding: '10px 20px',
          backgroundColor: variant === 'primary' ? '#007AFF' : '#6C757D',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          marginTop: '10px'
        }}
      >
        {disabled ? 'Disabled' : 'Interact'}
      </button>
      
      {/* Toast notification */}
      {renderToast()}
    </div>
  );
}

// React Native StyleSheet (Native pattern)
const nativeStyles = StyleSheet.create({ // StyleSheet.create pattern 1 (Native)
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

// Utility functions (shared cross-platform logic)
export const createMixedComponent = (props: MixedComponentProps) => {
  return React.createElement(MixedPlatformComponent, props);
};

export const validateMixedProps = (props: Partial<MixedComponentProps>): string[] => {
  const errors: string[] = [];
  
  if (!props.title || props.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!props.content || props.content.trim().length === 0) {
    errors.push('Content is required');
  }
  
  if (props.variant && !['primary', 'secondary'].includes(props.variant)) {
    errors.push('Invalid variant. Must be primary or secondary');
  }
  
  return errors;
};

// Platform detection utilities (shared)
export const getPlatformInfo = () => {
  return {
    isWeb: typeof window !== 'undefined',
    isReactNative: typeof window === 'undefined',
    platform: isReactNative && Platform ? Platform.OS : 'web',
    supportsTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };
};

// Configuration for platform-specific behavior
export const platformConfig = {
  web: {
    animationDuration: 300,
    touchSupport: true,
    keyboardSupport: true,
    className: 'web-optimized'
  },
  native: {
    animationDuration: 250,
    touchSupport: true,
    keyboardSupport: false,
    useNativeDriver: true
  }
};

// Factory function for creating platform-appropriate components
export const createPlatformComponent = (baseProps: MixedComponentProps) => {
  const platformInfo = getPlatformInfo();
  const config = platformInfo.isWeb ? platformConfig.web : platformConfig.native;
  
  return {
    ...baseProps,
    platformConfig: config,
    platformInfo
  };
};

export default MixedPlatformComponent;
/**
 * Environment Configuration for LocumTrueRate Frontend
 * 
 * This file allows environment-specific configuration without code changes.
 * For production deployment, modify these values as needed.
 */

// Initialize global environment configuration
window.ENV = window.ENV || {};

// Default configuration - will be overridden by environment-specific values
const defaultConfig = {
    // API Configuration
    API_BASE_URL: null, // null means auto-detect based on hostname
    API_TIMEOUT: 30000, // 30 seconds
    
    // Environment Settings
    ENVIRONMENT: 'auto-detect', // 'development', 'staging', 'production', or 'auto-detect'
    DEBUG_MODE: false,
    
    // Application Settings
    APP_NAME: 'LocumTrueRate',
    APP_VERSION: '1.0.0',
    
    // Feature Flags
    FEATURES: {
        CALCULATOR_SAVE: true,
        JOB_APPLICATIONS: true,
        RECRUITER_DASHBOARD: true,
        ANALYTICS: true
    },
    
    // Production-specific settings
    PRODUCTION: {
        API_BASE_URL: 'https://api.locumtruerate.com/v1',
        DEBUG_MODE: false,
        ANALYTICS_ENABLED: true
    },
    
    // Staging-specific settings
    STAGING: {
        API_BASE_URL: 'https://locumtruerate-stage.herokuapp.com/api/v1',
        DEBUG_MODE: true,
        ANALYTICS_ENABLED: false
    },
    
    // Development-specific settings
    DEVELOPMENT: {
        API_BASE_URL: 'http://localhost:4000/api/v1',
        DEBUG_MODE: true,
        ANALYTICS_ENABLED: false
    }
};

// Environment detection function
function detectEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'DEVELOPMENT';
    } else if (hostname.includes('stage') || hostname.includes('staging')) {
        return 'STAGING';
    } else if (hostname.includes('herokuapp.com') || hostname.includes('locumtruerate.com')) {
        return 'PRODUCTION';
    }
    
    return 'PRODUCTION'; // Default to production for unknown domains
}

// Apply environment-specific configuration
function applyEnvironmentConfig() {
    const environment = detectEnvironment();
    const envConfig = defaultConfig[environment] || {};
    
    // Merge default config with environment-specific config
    Object.assign(window.ENV, defaultConfig, envConfig, {
        DETECTED_ENVIRONMENT: environment
    });
    
    // Log configuration in development
    if (window.ENV.DEBUG_MODE) {
        console.log('🔧 Environment Configuration:', {
            environment,
            apiBaseUrl: window.ENV.API_BASE_URL,
            debugMode: window.ENV.DEBUG_MODE,
            hostname: window.location.hostname
        });
    }
}

// Manual override function for deployment scripts
window.setEnvironmentConfig = function(config) {
    Object.assign(window.ENV, config);
    console.log('🔧 Environment configuration manually overridden:', config);
};

// Apply configuration immediately
applyEnvironmentConfig();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ENV;
}
// Environment Configuration System
export interface EnvironmentConfig {
  name: string;
  apiUrl: string;
  apiBaseUrl: string;
  debug: boolean;
  enableLogging: boolean;
  isProduction: boolean;
}

export const environments: Record<string, EnvironmentConfig> = {
  development: {
    name: 'Development',
    apiUrl: 'http://localhost:5000/api-v1',
    apiBaseUrl: 'http://localhost:5000',
    debug: true,
    enableLogging: true,
    isProduction: false,
  },
  production: {
    name: 'Production',
    apiUrl: 'https://your-production-domain.com/api-v1',
    apiBaseUrl: 'https://your-production-domain.com',
    debug: false,
    enableLogging: false,
    isProduction: true,
  },
  staging: {
    name: 'Staging',
    apiUrl: 'https://staging.your-domain.com/api-v1',
    apiBaseUrl: 'https://staging.your-domain.com',
    debug: true,
    enableLogging: true,
    isProduction: false,
  },
};

// Get current environment from various sources
export const getCurrentEnvironment = (): string => {
  // Priority: localStorage > env variable > default
  if (typeof window !== 'undefined') {
    const storedEnv = localStorage.getItem('app-environment');
    if (storedEnv && environments[storedEnv]) {
      return storedEnv;
    }
  }
  
  const envFromMeta = import.meta.env?.VITE_APP_ENV;
  if (envFromMeta && environments[envFromMeta]) {
    return envFromMeta;
  }
  
  return import.meta.env.PROD ? 'production' : 'development';
};

// Get current environment configuration
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const currentEnv = getCurrentEnvironment();
  const config = environments[currentEnv];
  
  if (!config) {
    console.warn(`Environment '${currentEnv}' not found, falling back to development`);
    return environments.development;
  }
  
  // Override with environment variables if available
  return {
    ...config,
    apiUrl: import.meta.env?.VITE_API_URL || config.apiUrl,
    apiBaseUrl: import.meta.env?.VITE_API_BASE_URL || config.apiBaseUrl,
    debug: import.meta.env?.VITE_DEBUG === 'true' || config.debug,
    enableLogging: import.meta.env?.VITE_ENABLE_LOGGING === 'true' || config.enableLogging,
  };
};

// Switch environment (client-side only)
export const switchEnvironment = (envName: string): boolean => {
  if (typeof window === 'undefined') {
    console.warn('Environment switching is only available in browser');
    return false;
  }
  
  if (!environments[envName]) {
    console.error(`Environment '${envName}' does not exist`);
    return false;
  }
  
  try {
    localStorage.setItem('app-environment', envName);
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('environment-changed', {
      detail: { environment: envName, config: environments[envName] }
    }));
    
    return true;
  } catch (error) {
    console.error('Failed to switch environment:', error);
    return false;
  }
};

// Validate URL format
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Get environment indicator for UI
export const getEnvironmentIndicator = (): { name: string; color: string; isDev: boolean } => {
  const config = getEnvironmentConfig();
  const envName = getCurrentEnvironment();
  
  const indicators = {
    development: { name: 'DEV', color: '#10B981', isDev: true },
    staging: { name: 'STAGING', color: '#F59E0B', isDev: true },
    production: { name: 'PROD', color: '#EF4444', isDev: false },
  };
  
  return indicators[envName as keyof typeof indicators] || indicators.development;
};

// Enhanced logging based on environment
export const envLog = {
  debug: (...args: any[]) => {
    const config = getEnvironmentConfig();
    if (config.debug && config.enableLogging) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    const config = getEnvironmentConfig();
    if (config.enableLogging) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    const config = getEnvironmentConfig();
    if (config.enableLogging) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors regardless of environment
    console.error('[ERROR]', ...args);
  },
};
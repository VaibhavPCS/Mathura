import React, { useState, useEffect } from 'react';
import { 
  environments, 
  getCurrentEnvironment, 
  getEnvironmentConfig, 
  switchEnvironment,
  validateUrl,
  type EnvironmentConfig 
} from '@/lib/env-config';
import { EnvironmentSwitcher } from '@/components/environment-switcher';

export default function EnvironmentSettings() {
  const [currentEnv, setCurrentEnv] = useState(getCurrentEnvironment());
  const [config, setConfig] = useState(getEnvironmentConfig());
  const [customUrls, setCustomUrls] = useState({
    development: environments.development.apiUrl,
    production: environments.production.apiUrl,
    staging: environments.staging.apiUrl,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleEnvironmentChange = () => {
      setCurrentEnv(getCurrentEnvironment());
      setConfig(getEnvironmentConfig());
    };

    window.addEventListener('environment-changed', handleEnvironmentChange);
    
    return () => {
      window.removeEventListener('environment-changed', handleEnvironmentChange);
    };
  }, []);

  const validateAndSaveUrls = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate all URLs
    Object.entries(customUrls).forEach(([env, url]) => {
      if (!validateUrl(url)) {
        newErrors[env] = 'Invalid URL format';
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSaving(true);
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('custom-environment-urls', JSON.stringify(customUrls));
        
        // Update environments object (this would need to be more sophisticated in a real app)
        Object.entries(customUrls).forEach(([env, url]) => {
          if (environments[env]) {
            environments[env].apiUrl = url;
            environments[env].apiBaseUrl = url.replace('/api-v1', '');
          }
        });

        // Show success message
        const event = new CustomEvent('show-toast', {
          detail: {
            type: 'success',
            message: 'Environment URLs updated successfully'
          }
        });
        window.dispatchEvent(event);

        // Trigger environment change to update axios instances
        window.dispatchEvent(new CustomEvent('environment-changed', {
          detail: { environment: currentEnv, config: environments[currentEnv] }
        }));

      } catch (error) {
        console.error('Failed to save environment URLs:', error);
        const event = new CustomEvent('show-toast', {
          detail: {
            type: 'error',
            message: 'Failed to save environment URLs'
          }
        });
        window.dispatchEvent(event);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const resetToDefaults = () => {
    setCustomUrls({
      development: 'http://localhost:5000/api-v1',
      production: 'https://your-production-domain.com/api-v1',
      staging: 'https://staging.your-domain.com/api-v1',
    });
    setErrors({});
  };

  const testConnection = async (envName: string) => {
    const url = customUrls[envName as keyof typeof customUrls];
    if (!validateUrl(url)) {
      setErrors(prev => ({ ...prev, [envName]: 'Invalid URL format' }));
      return;
    }

    try {
      const baseUrl = url.replace('/api-v1', '');
      const response = await fetch(`${baseUrl}/health`, { 
        method: 'GET',
        mode: 'cors'
      });
      
      if (response.ok) {
        const event = new CustomEvent('show-toast', {
          detail: {
            type: 'success',
            message: `${envName} environment is reachable`
          }
        });
        window.dispatchEvent(event);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const event = new CustomEvent('show-toast', {
        detail: {
          type: 'error',
          message: `Failed to connect to ${envName} environment: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Environment Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure API endpoints and switch between development, staging, and production environments.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Environment Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Current Environment</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <EnvironmentSwitcher showIndicator={true} />
              </div>
              <div className="text-sm text-gray-500">
                <div>API URL: {config.apiUrl}</div>
                <div>Debug Mode: {config.debug ? 'Enabled' : 'Disabled'}</div>
                <div>Logging: {config.enableLogging ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
          </div>

          {/* Environment URL Configuration */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Environment URLs</h2>
            <div className="space-y-4">
              {Object.entries(environments).map(([envKey, envConfig]) => (
                <div key={envKey} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: envKey === 'development' ? '#10B981' : 
                                          envKey === 'staging' ? '#F59E0B' : '#EF4444' 
                        }}
                      />
                      {envConfig.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => testConnection(envKey)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Test Connection
                      </button>
                      {currentEnv !== envKey && (
                        <button
                          onClick={() => switchEnvironment(envKey)}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Switch To
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">API URL</label>
                      <input
                        type="url"
                        value={customUrls[envKey as keyof typeof customUrls]}
                        onChange={(e) => setCustomUrls(prev => ({ ...prev, [envKey]: e.target.value }))}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          errors[envKey] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="https://api.example.com/api-v1"
                      />
                      {errors[envKey] && (
                        <p className="mt-1 text-sm text-red-600">{errors[envKey]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset to Defaults
            </button>
            
            <button
              onClick={validateAndSaveUrls}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Environment Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Environment Information</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Development: Use localhost:5000 for local backend development</p>
              <p>• Staging: Use staging server for testing before production</p>
              <p>• Production: Use live production server for real users</p>
              <p>• Environment settings are saved locally and persist across sessions</p>
              <p>• Switching environments will reload the page to apply changes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  getCurrentEnvironment, 
  switchEnvironment, 
  environments, 
  getEnvironmentIndicator,
  getEnvironmentConfig 
} from '@/lib/env-config';

interface EnvironmentSwitcherProps {
  className?: string;
  showIndicator?: boolean;
}

export const EnvironmentSwitcher: React.FC<EnvironmentSwitcherProps> = ({ 
  className = '', 
  showIndicator = true 
}) => {
  const [currentEnv, setCurrentEnv] = useState(getCurrentEnvironment());
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState(getEnvironmentConfig());

  useEffect(() => {
    const handleEnvironmentChange = (event: CustomEvent) => {
      setCurrentEnv(event.detail.environment);
      setConfig(getEnvironmentConfig());
    };

    window.addEventListener('environment-changed', handleEnvironmentChange as EventListener);
    
    return () => {
      window.removeEventListener('environment-changed', handleEnvironmentChange as EventListener);
    };
  }, []);

  const handleEnvironmentSwitch = (envName: string) => {
    if (switchEnvironment(envName)) {
      setCurrentEnv(envName);
      setIsOpen(false);
      
      // Show confirmation
      const event = new CustomEvent('show-toast', {
        detail: {
          type: 'success',
          message: `Switched to ${environments[envName].name} environment`
        }
      });
      window.dispatchEvent(event);
      
      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const indicator = getEnvironmentIndicator();

  return (
    <div className={`relative ${className}`}>
      {showIndicator && (
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="px-2 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: indicator.color }}
          >
            {indicator.name}
          </div>
          <span className="text-xs text-gray-500">
            {config.apiUrl}
          </span>
        </div>
      )}
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: indicator.color }}
          />
          {environments[currentEnv]?.name || 'Unknown'}
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50">
            <div className="py-1">
              {Object.entries(environments).map(([envKey, envConfig]) => (
                <button
                  key={envKey}
                  onClick={() => handleEnvironmentSwitch(envKey)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                    currentEnv === envKey ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ 
                        backgroundColor: envKey === 'development' ? '#10B981' : 
                                        envKey === 'staging' ? '#F59E0B' : '#EF4444' 
                      }}
                    />
                    <span className="font-medium">{envConfig.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 truncate ml-2">
                    {envConfig.apiUrl}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-200 px-4 py-2">
              <div className="text-xs text-gray-500">
                <div>Current: {config.apiUrl}</div>
                <div>Debug: {config.debug ? 'On' : 'Off'}</div>
                <div>Logging: {config.enableLogging ? 'On' : 'Off'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Environment indicator component for header/navbar
export const EnvironmentIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [indicator, setIndicator] = useState(getEnvironmentIndicator());

  useEffect(() => {
    const handleEnvironmentChange = () => {
      setIndicator(getEnvironmentIndicator());
    };

    window.addEventListener('environment-changed', handleEnvironmentChange);
    
    return () => {
      window.removeEventListener('environment-changed', handleEnvironmentChange);
    };
  }, []);

  // Only show in development/staging
  if (!indicator.isDev) return null;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div 
        className="px-2 py-1 rounded text-xs font-medium text-white"
        style={{ backgroundColor: indicator.color }}
      >
        {indicator.name}
      </div>
    </div>
  );
};
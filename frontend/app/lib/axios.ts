import axios from "axios";
import { getEnvironmentConfig, envLog, validateUrl } from "./env-config";

// Get base URL from environment configuration
const getBaseURL = (): string => {
  try {
    const config = getEnvironmentConfig();
    const baseUrl = config.apiBaseUrl;
    
    // Validate URL format
    if (!validateUrl(baseUrl)) {
      envLog.error('Invalid API base URL format:', baseUrl);
      throw new Error(`Invalid API base URL format: ${baseUrl}`);
    }
    
    envLog.debug('Using API base URL:', baseUrl);
    return baseUrl;
  } catch (error) {
    envLog.error('Failed to get base URL, falling back to localhost:', error);
    return 'http://localhost:5000';
  }
};

// Initialize axios instance
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Listen for environment changes and update base URL
if (typeof window !== 'undefined') {
  window.addEventListener('environment-changed', () => {
    const newBaseUrl = getBaseURL();
    axiosInstance.defaults.baseURL = newBaseUrl;
    envLog.info('Axios base URL updated to:', newBaseUrl);
  });
}

export default axiosInstance;

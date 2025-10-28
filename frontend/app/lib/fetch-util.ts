import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { getEnvironmentConfig, envLog, validateUrl } from "./env-config";

// Get base URL from environment configuration
const getBaseURL = (): string => {
  try {
    const config = getEnvironmentConfig();
    const baseUrl = config.apiUrl;
    
    // Validate URL format
    if (!validateUrl(baseUrl)) {
      envLog.error('Invalid API URL format:', baseUrl);
      throw new Error(`Invalid API URL format: ${baseUrl}`);
    }
    
    envLog.debug('Using API URL:', baseUrl);
    return baseUrl;
  } catch (error) {
    envLog.error('Failed to get base URL, falling back to localhost:', error);
    return 'http://localhost:5000/api-v1';
  }
};

// Initialize base URL
let BASE_URL = getBaseURL();

// Listen for environment changes and update base URL
if (typeof window !== 'undefined') {
  window.addEventListener('environment-changed', () => {
    const newBaseUrl = getBaseURL();
    BASE_URL = newBaseUrl;
    api.defaults.baseURL = newBaseUrl;
    envLog.info('API base URL updated to:', newBaseUrl);
  });
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable cookies for HTTP-only authentication
});

// ✅ ENHANCED REQUEST INTERCEPTOR
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Remove localStorage token handling - cookies are sent automatically
  
  // ✅ ADD WORKSPACE HEADER SUPPORT (Optional - for future use)
  const currentWorkspaceId = localStorage.getItem("currentWorkspaceId");
  if (currentWorkspaceId && config.url?.includes('/workspace/')) {
    if (config.headers) {
      config.headers['workspace-id'] = currentWorkspaceId;
    }
  }
  
  envLog.debug('API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

// Keep existing response interceptor and functions
api.interceptors.response.use(
  (response: AxiosResponse) => {
    envLog.debug('API Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    envLog.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response && error.response.status === 401) {
      envLog.warn('Unauthorized access detected, triggering logout');
      window.dispatchEvent(new Event("force-logout"));
    }
    return Promise.reject(error);
  }
);

// ✅ ALL API METHODS USING AXIOS
const postData = async <T = any>(url: string, data: unknown): Promise<T> => {
  const response = await api.post(url, data);
  return response.data;
};

const putData = async <T = any>(url: string, data: unknown): Promise<T> => {
  const response = await api.put(url, data);
  return response.data;
};

const updateData = async <T = any>(url: string, data: unknown): Promise<T> => {
  const response = await api.put(url, data);
  return response.data;
};

const fetchData = async <T = any>(url: string): Promise<T> => {
  const response = await api.get<T>(url);
  return response.data;
};

// ✅ CLEAN: Single deleteData function using axios
const deleteData = async <T = any>(url: string): Promise<T> => {
  const response = await api.delete(url);
  return response.data;
};

export { postData, putData, updateData, fetchData, deleteData };

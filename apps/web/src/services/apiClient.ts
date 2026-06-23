// apps/web/src/services/apiClient.ts
import axios from 'axios';

export interface ApiResponseEnvelope<T> {
  data: T;
  meta: {
    correlationId: string;
    timestamp: string;
  };
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  withCredentials: true, // Crucial: forces browser to pass secure httpOnly tokens automatically
});

// Outbound request interceptor for handling dynamic transaction variables
apiClient.interceptors.request.use(
  (config) => {
    // Inject a unique cryptographic idempotency token on data mutations to prevent double-submits
    if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
      config.headers['X-Idempotency-Key'] = crypto.randomUUID();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Inbound response interceptor matching the Zero-Collapse layout protocols
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('⚠️ Unauthorized session context detected. Redirecting to SSO Identity Gateway.');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

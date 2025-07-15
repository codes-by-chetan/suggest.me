/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosInstance,
} from 'axios';
import config from '@/config/env.config';
import { ApiResponse } from '@/interfaces/api/api-response.interface';
import { jwtDecode } from 'jwt-decode';
import { router } from '../main';
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
} from './token.service';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Checks if the JWT token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: { exp: number } = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch (_error) {
    return true;
  }
};

// Refreshes the access token
const _refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await axios.post(
      `${config.API_URL}/auth/refresh-token`,
      {},
      {
        withCredentials: true,
      }
    );
    const newAccessToken = response.data.token;
    setAccessToken(newAccessToken);
    return newAccessToken;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        removeAccessToken();
        router.navigate({ to: '/sign-in' });
      }
    }
    return null;
  }
};

// Creates an axios instance with request and response interceptors
const createApiClient = (BASE_URL: string): AxiosInstance => {
  const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 20000,
    withCredentials: true,
  });

  // Request Interceptor: Adds authorization token and handles token refresh
  apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      if (token && isTokenExpired(token)) {
        
        // token = await refreshAccessToken();
      }
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response Interceptor: Handles 401 errors and retries with refreshed token
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const originalRequest = error.config as CustomAxiosRequestConfig;
        if (!originalRequest || originalRequest._retry) {
          removeAccessToken();
          router.navigate({ to: '/sign-in' });
          return Promise.reject(error);
        }

        originalRequest._retry = true;
        // const newToken = await refreshAccessToken();
        // if (!newToken) {
          return Promise.reject(error);
        // }

        // originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        // return apiClient(originalRequest);
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
};

// Initialize the API client
const BASE_URL = config.API_URL;
console.log(BASE_URL);

const apiClient = createApiClient(BASE_URL);

// Retries a request with exponential backoff
const retryRequest = async <T>(
  fn: () => Promise<AxiosResponse<ApiResponse<T>>>,
  retries: number = 3,
  delay: number = 1000
): Promise<ApiResponse<T>> => {
  try {
    const response = await fn();
    return handleResponse<T>(response);
  } catch (error: any) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay);
    }
    return handleError(error);
  }
};

// Handles errors consistently across API calls
const handleError = (error: AxiosError): ApiResponse<never> => {
  const errorResponse: ApiResponse<never> = {
    success: false,
    message: 'An error occurred',
    statusCode: 500,
    status: 'error',
    isOperational: true,
    redirect: null,
  };

  if (error.response) {
    const responseData = error.response.data as any;
    errorResponse.message = responseData?.message || 'Server error';
    errorResponse.statusCode = error.response.status;
    errorResponse.status = responseData?.status || 'error';
    errorResponse.redirect = responseData?.redirect || null;
    errorResponse.isOperational = responseData?.isOperational ?? true;
  } else if (error.request) {
    errorResponse.message = 'Network error. Please try again later.';
    errorResponse.statusCode = 0;
    errorResponse.status = 'network_error';
  } else {
    errorResponse.message = error.message || 'An unexpected error occurred';
    errorResponse.statusCode = 500;
    errorResponse.status = 'error';
  }

  return errorResponse;
};

// Processes successful API responses
const handleResponse = <T>(
  response: AxiosResponse<ApiResponse<T>>
): ApiResponse<T> => {
  const apiResponse = response.data as ApiResponse<T>;
  if (!apiResponse.success) {
    return {
      success: false,
      message: apiResponse.message || 'API request failed',
      statusCode: response.status,
      status: 'error',
      isOperational: true,
      redirect: apiResponse.redirect || null,
    };
  }
  return apiResponse;
};

// Generic API methods with params support
const get = async <T>(
  url: string,
  params: any = {},
  retries: number = 3
): Promise<ApiResponse<T>> => {
  return retryRequest<T>(
    () => apiClient.get<ApiResponse<T>>(url, { params }),
    retries
  );
};

const post = async <T>(
  url: string,
  data: any,
  params: any = {},
  retries: number = 3
): Promise<ApiResponse<T>> => {
  return retryRequest<T>(
    () => apiClient.post<ApiResponse<T>>(url, data, { params }),
    retries
  );
};

const patch = async <T>(
  url: string,
  data: any,
  params: any = {},
  retries: number = 3
): Promise<ApiResponse<T>> => {
  return retryRequest<T>(
    () => apiClient.patch<ApiResponse<T>>(url, data, { params }),
    retries
  );
};

const put = async <T>(
  url: string,
  data: any,
  params: any = {},
  retries: number = 3
): Promise<ApiResponse<T>> => {
  return retryRequest<T>(
    () => apiClient.put<ApiResponse<T>>(url, data, { params }),
    retries
  );
};

const deleteRequest = async <T>(
  url: string,
  params: any = {},
  retries: number = 3
): Promise<ApiResponse<T>> => {
  return retryRequest<T>(
    () => apiClient.delete<ApiResponse<T>>(url, { params }),
    retries
  );
};

const publicPost = async <T>(
  url: string,
  data: any,
  params: any = {},
  retries: number = 3
): Promise<ApiResponse<T>> => {
  return retryRequest<T>(
    () => axios.post<ApiResponse<T>>(`${BASE_URL}/${url}`, data, { params }),
    retries
  );
};

export default {
  get,
  post,
  put,
  delete: deleteRequest,
  patch,
  publicPost,
};

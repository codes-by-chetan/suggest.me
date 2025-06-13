/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import config from '@/config/env.config';
import { ApiResponse } from '@/interfaces/api/api-response.interface';
import ApiErrorResponse from '@/interfaces/api/error-response.interface';
import { getAccessToken } from './token.service';

const BASE_URL = config.API_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Need to add refresh token logic here.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

const retryRequest = async <T>(
  fn: () => Promise<AxiosResponse<T>>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    const response = await fn();
    return response.data; // Return the actual data from the response
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay)); // Wait for a delay before retrying
      return retryRequest(fn, retries - 1, delay); // Retry the API call
    }
    throw error; // If no retries left, throw the error
  }
};

const handleError = (error: AxiosError): ApiErrorResponse => {
  // if (error.response) {
  //   // Server returned a response (e.g., 400 or 500 status)
  //   //@ts-expect-error message is undefined
  //   return { error: error.response.data?.message || 'Something went wrong' }
  // } else if (error.request) {
  //   // Request was made but no response received
  //   return { error: 'Network error. Please try again later.' }
  // } else {
  //   // Something else went wrong
  //   return { error: error.message || 'Oops something went wrong!!' }
  // }

  return error.response?.data as ApiErrorResponse;
};

const handleResponse = (response: AxiosResponse | any): ApiResponse =>
  response.data as ApiResponse;

const get = async <T>(
  url: string,
  retries: number = 3
): Promise<ApiResponse | ApiErrorResponse> => {
  return retryRequest(() => apiClient.get<T>(url), retries)
    .then(handleResponse)
    .catch(handleError);
};

const post = async <T>(
  url: string,
  data: any,
  retries: number = 3
): Promise<ApiResponse | ApiErrorResponse> => {
  return retryRequest(() => apiClient.post<T>(url, data), retries)
    .then(handleResponse)
    .catch(handleError);
};

const patch = async <T>(
  url: string,
  data: any,
  retries: number = 3
): Promise<ApiResponse | ApiErrorResponse> => {
  return retryRequest(() => apiClient.patch<T>(url, data), retries)
    .then(handleResponse)
    .catch(handleError);
};

const put = async <T>(
  url: string,
  data: any,
  retries: number = 3
): Promise<ApiResponse | ApiErrorResponse> => {
  return retryRequest(() => apiClient.put<T>(url, data), retries)
    .then(handleResponse)
    .catch(handleError);
};

const deleteRequest = async <T>(
  url: string,
  retries: number = 3
): Promise<ApiResponse | ApiErrorResponse> => {
  return retryRequest(() => apiClient.delete<T>(url), retries)
    .then(handleResponse)
    .catch(handleError);
};

const publicPost = async <T>(
  url: string,
  data: any,
  retries: number = 3
): Promise<ApiResponse | ApiErrorResponse> => {
  return retryRequest(() => {
    return axios.post<T>(`${BASE_URL}/${url}`, data);
  }, retries)
    .then(handleResponse)
    .catch(handleError);
};

export default {
  get,
  post,
  put,
  delete: deleteRequest,
  patch,
  publicPost,
};

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import config from '@/config/env.config'
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
} from '@/services/token.service'
import { jwtDecode } from 'jwt-decode'
import { router } from '../main'

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// Helper function to check token expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: { exp: number } = jwtDecode(token)
    return decoded.exp * 1000 < Date.now()
    //eslint-disable-next-line
  } catch (error) {
    return true
  }
}

// Function to refresh token
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await axios.post(
      `${config.API_URL}/auth/refresh-token`,
      {},
      {
        withCredentials: true, // Ensure cookies are sent
      }
    )
    const newAccessToken = response.data.token
    setAccessToken(newAccessToken) // Store the new token
    return newAccessToken
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        removeAccessToken()
        router.navigate({ to: '/sign-in' })
      }
    }
    return null
  }
}

const createApiClient = (API_URL:string): AxiosInstance => {
  const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 20000,
    withCredentials: true,
  })

  // Request Interceptor
  apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      let token = getAccessToken()

      if (token && isTokenExpired(token)) {
        token = await refreshAccessToken()
      }

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }

      return config
    },
    (error: AxiosError) => Promise.reject(error)
  )

  // Response Interceptor
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const originalRequest = error.config as CustomAxiosRequestConfig
        //@ts-expect-error _retry is undefined
        if (!originalRequest && originalRequest._retry) {
          removeAccessToken()
          router.navigate({ to: '/sign-in' })
          return Promise.reject(error)
        }

        originalRequest._retry = true // Mark request as retried

        const newToken = await refreshAccessToken()
        if (!newToken) {
          return Promise.reject(error)
        }

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return apiClient(originalRequest) // Retry the original request
      }

      return Promise.reject(error)
    }
  )

  return apiClient
}

export default createApiClient

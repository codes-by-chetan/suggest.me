/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import config from '@/config/env.config'
import ApiErrorResponse from '@/interfaces/api/error-response.interface'
import { Credentials } from '@/interfaces/api/login-response.interface.ts'
import { registrationDetails, SignUpApiResponse } from '@/interfaces/api/signup-response.interface.ts'
import { verifyOtpData } from '@/interfaces/api/verify-otp.interface.ts'
import createApiClient from '@/utils/axios-client.ts'

const authApi = createApiClient(config.API_URL)

export const authService = {
  register: async (data: registrationDetails):Promise<SignUpApiResponse|ApiErrorResponse> =>
    authApi.post('/auth/register', data).then(),
  login: async (data: Credentials) => authApi.post('/auth/login', data),
  verifyUser: async () => authApi.get('/auth/verify-user'),
  isAdmin: async () => authApi.get('/auth/verify-admin'),
  refreshUserDetails: async () => authApi.get('/auth/refresh-user'),
  changePassword: async () => authApi.post('/auth/change-password'),
  verifyOtp: async (data: verifyOtpData) =>
    authApi.post('/auth/verify-otp', data),
  forgotPassword: async (data: { email: string }) =>
    authApi.post('/auth/forgot-password', data),
  resetPassword: async (data: { password: string }, token: string) =>
    authApi.post(`/auth/reset-password?token=${token}`, data),
  activateAccount: async (token: string) =>
    authApi.post(`/auth/activate?token=${token}`),
  resendAccountActivation: async (data: { email: string }) =>
    authApi.post(`/auth/resend-account-activation`, data),
  logout: async () =>
    authApi.post(
      `/auth/logout`,
      {},
      {
        withCredentials: true, // Ensure cookies are sent
      }
    ),
  switchOrganization: async (data: { orgId: string }) =>
    authApi.post('/auth/switch-organizations', data),
}

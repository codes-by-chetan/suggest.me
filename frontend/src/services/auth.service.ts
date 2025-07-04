/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiResponse } from '@/interfaces/api/api-response.interface';
import {
  Credentials,
  LoginApiResponse,
} from '@/interfaces/api/login-response.interface.ts';
import {
  registrationDetails,
  SignUpApiResponse,
} from '@/interfaces/api/signup-response.interface.ts';
import { verifyOtpData } from '@/interfaces/api/verify-otp.interface.ts';
import apiService from './api.service';

export const AuthService = {
  register: async (
    data: registrationDetails
  ): Promise<ApiResponse<SignUpApiResponse['data']>> =>
    apiService.post('/auth/register', data),
  login: async (
    data: Credentials
  ): Promise<ApiResponse<LoginApiResponse['data']>> =>
    apiService.post('/auth/login', data),
  isAuthenticated: async (): Promise<boolean> =>
    apiService
      .get('/auth/verify-user')
      .then((_response: any) => {
        return true;
      })
      .catch((_err) => {
        // getToast("error", _err?.response?.data?.message || "failed to fetch");
        // if(_err?.response.)
        return false;
      }),
  verifyUser: async (): Promise<ApiResponse<any>> =>
    apiService.get('/auth/verify-user'),

  isAdmin: async (): Promise<boolean> =>
    apiService
      .get('/auth/verify-admin')
      .then((_response: any) => {
        return true;
      })
      .catch((_err) => {
        return false;
      }),
  refreshUserDetails: async (): Promise<ApiResponse<any>> =>
    apiService.get('/auth/refresh-user'),
  changePassword: async (data: {
    oldPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<any>> =>
    apiService.post('/auth/change-password', data),
  verifyOtp: async (data: verifyOtpData): Promise<ApiResponse<any>> =>
    apiService.post('/auth/verify-otp', data),
  forgotPassword: async (data: { email: string }): Promise<ApiResponse<any>> =>
    apiService.post('/auth/forgot-password', data),
  resetPassword: async (
    data: { password: string },
    token: string
  ): Promise<ApiResponse<any>> =>
    apiService.post(`/auth/reset-password?token=${token}`, data),
  // activateAccount: async (token: string): Promise<ApiResponse<any>> =>
  //   apiService.post(`/auth/activate?token=${token}`),
  resendAccountActivation: async (data: {
    email: string;
  }): Promise<ApiResponse<any>> =>
    apiService.post(`/auth/resend-account-activation`, data),
  logout: async (): Promise<ApiResponse<any>> => apiService.get(`/auth/logout`),
  switchOrganization: async (data: {
    orgId: string;
  }): Promise<ApiResponse<any>> =>
    apiService.post('/auth/switch-organizations', data),
};

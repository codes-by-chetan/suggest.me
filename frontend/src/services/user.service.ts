/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import config from '@/config/env.config'
import ApiErrorResponse from '@/interfaces/api/error-response.interface'
import { Credentials } from '@/interfaces/api/login-response.interface.ts'
import { registrationDetails, SignUpApiResponse } from '@/interfaces/api/signup-response.interface.ts'
import { verifyOtpData } from '@/interfaces/api/verify-otp.interface.ts'
import createApiClient from '@/utils/axios-client.ts'

const userApi = createApiClient(config.API_URL)


export const UserService = {
  getUserProfile: async ():Promise<UserProfileResponse|ApiErrorResponse> =>
    userApi.get('/user/profile').then(),
  login: async (data: Credentials) => userApi.post('/auth/login', data),
  verifyUser: async () => userApi.get('/auth/verify-user'),
  isAdmin: async () => userApi.get('/auth/verify-admin'),
  refreshUserDetails: async () => userApi.get('/auth/refresh-user'),
  changePassword: async () => userApi.post('/auth/change-password'),
  verifyOtp: async (data: verifyOtpData) =>
    userApi.post('/auth/verify-otp', data),
  forgotPassword: async (data: { email: string }) =>
    userApi.post('/auth/forgot-password', data),
  resetPassword: async (data: { password: string }, token: string) =>
    userApi.post(`/auth/reset-password?token=${token}`, data),
  activateAccount: async (token: string) =>
    userApi.post(`/auth/activate?token=${token}`),
  resendAccountActivation: async (data: { email: string }) =>
    userApi.post(`/auth/resend-account-activation`, data),
  logout: async () =>
    userApi.post(
      `/auth/logout`,
      {},
      {
        withCredentials: true, // Ensure cookies are sent
      }
    ),
  switchOrganization: async (data: { orgId: string }) =>
    userApi.post('/auth/switch-organizations', data),
}



export default class UserService {
  getAccessToken() {
    const token: string | null = localStorage.getItem("token");
    return token;
  }

  async getUserProfile(): Promise<UserProfileResponse> {
    return api
      .get("user/profile", {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }
  async getUserProfileById(userId: string): Promise<UserProfileResponse> {
    return api
      .get(`profiles/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }
  async followUser(userId: string): Promise<response> {
    return api
      .get(`relations/follow/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }
  async unFollowUser(userId: string): Promise<response> {
    return api
      .get(`relations/unfollow/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }

  async acceptFollowRequest(requestId: string): Promise<UserProfileResponse> {
    return api
      .get(`relations/accept/follow/${requestId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }

  async getRelation(userId: string): Promise<UserProfileResponse> {
    return api
      .get(`relations/relation/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }
  async getFollowsYou(userId: string): Promise<UserProfileResponse> {
    return api
      .get(`relations/follows/you/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }

  async getUserWholeProfile(): Promise<response> {
    return api
      .get("user/profile-whole", {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }

  async getUserFriends(): Promise<friendsResponse> {
    return api
      .get("relations/friends", {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }
  async updateUserProfilePicture(data: any): Promise<response> {
    return api
      .post("user/avatar", data, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }

  async updateUserProfile(data: any): Promise<response> {
    return api
      .post("user/update/profile", data, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }
}

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import config from '@/config/env.config';
import { ApiResponse } from '@/interfaces/api/api-response.interface';
import ApiErrorResponse from '@/interfaces/api/error-response.interface';
import {
  friendsResponse,
  UserProfileResponse,
} from '@/interfaces/api/user.interface';
import createApiClient from '@/utils/axios-client.ts';

const userApi = createApiClient(config.API_URL);

export const UserService = {
  getUserProfile: async (): Promise<UserProfileResponse | ApiErrorResponse> =>
    userApi
      .get('/user/profile')
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      }),

  getUserProfileById: async (
    userId: string
  ): Promise<UserProfileResponse | ApiErrorResponse> =>
    userApi
      .get(`profiles/${userId}`)
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      }),


  followUser: async (userId: string): Promise<ApiResponse | ApiErrorResponse> =>
    userApi
      .get(`relations/follow/${userId}`)
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      }),


  unFollowUser: async (
    userId: string
  ): Promise<ApiResponse | ApiErrorResponse> =>
    userApi
      .get(`relations/unfollow/${userId}`)
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      }),


  acceptFollowRequest: async (
    requestId: string
  ): Promise<UserProfileResponse | ApiErrorResponse> =>
    userApi
      .get(`relations/accept/follow/${requestId}`)
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      }),

      
  getRelation: async (
    userId: string
  ): Promise<UserProfileResponse | ApiErrorResponse> =>
    userApi
      .get(`relations/relation/${userId}`)
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      }),
  getFollowsYou: async (userId: string): Promise<UserProfileResponse> =>
    userApi
      .get(`relations/follows/you/${userId}`)
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      }),
  getUserWholeProfile: async (): Promise<ApiResponse | ApiErrorResponse> =>
    userApi
      .get('user/profile-whole')
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      }),
  getUserFriends: async (): Promise<friendsResponse | ApiErrorResponse> =>
    userApi
      .get('relations/friends')
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      }),
  updateUserProfilePicture: async (
    data: any
  ): Promise<ApiResponse | ApiErrorResponse> =>
    userApi
      .post('user/avatar', data)
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      }),
};

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiResponse } from '@/interfaces/api/api-response.interface';
import {
  UserProfileData,
  friendsResponse,
} from '@/interfaces/api/user.interface';
import apiService from './api.service';

export const UserService = {
  getUserProfile: async (): Promise<ApiResponse<UserProfileData>> =>
    apiService.get('/user/profile'),
  getUserProfileById: async (
    userId: string
  ): Promise<ApiResponse<UserProfileData>> =>
    apiService.get(`profiles/${userId}`),
  followUser: async (userId: string): Promise<ApiResponse<any>> =>
    apiService.get(`relations/follow/${userId}`),
  unFollowUser: async (userId: string): Promise<ApiResponse<any>> =>
    apiService.get(`relations/unfollow/${userId}`),
  acceptFollowRequest: async (
    requestId: string
  ): Promise<ApiResponse<UserProfileData>> =>
    apiService.get(`relations/accept/follow/${requestId}`),
  getRelation: async (userId: string): Promise<ApiResponse<UserProfileData>> =>
    apiService.get(`relations/relation/${userId}`),
  getFollowsYou: async (
    userId: string
  ): Promise<ApiResponse<UserProfileData>> =>
    apiService.get(`relations/follows/you/${userId}`),
  getUserWholeProfile: async (): Promise<ApiResponse<any>> =>
    apiService.get('user/profile-whole'),
  getUserFriends: async (): Promise<ApiResponse<friendsResponse['data']>> =>
    apiService.get('relations/friends'),
  updateUserProfilePicture: async (data: any): Promise<ApiResponse<any>> =>
    apiService.post('user/avatar', data),
};

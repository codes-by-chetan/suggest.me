/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiResponse } from '@/interfaces/api/api-response.interface';
import apiService from './api.service';

// Interface for content response data
export interface ContentResponse {
  id: string;
  contentId: string;
  title: string;
  type: string;
  imageUrl?: string;
  year?: string;
  creator: string;
  description?: string;
  status: string;
  addedAt: string;
  suggestionId: string | null;
}

interface GetUserContentParams {
  page?: number;
  limit?: number;
  type?: string;
}

// Interface for add content request
interface AddContentParams {
  content: { id: string; type: string };
  status?: string;
  suggestionId?: string;
  [key: string]: any;
}

// Interface for update content status request
interface UpdateContentStatusParams {
  status: string;
  [key: string]: any;
}

// Interface for check content request
interface CheckContentParams {
  contentId?: string;
  suggestionId?: string;
}

const ContentListService = {
  addContent: async (data: AddContentParams): Promise<ApiResponse<any>> =>
    apiService.post('user/content', data),
  updateContentStatus: async (
    contentId: string,
    data: UpdateContentStatusParams
  ): Promise<ApiResponse<any>> =>
    apiService.patch(`user/content/${contentId}/status`, data),
  getUserContent: async (
    params: GetUserContentParams = {}
  ): Promise<ApiResponse<any>> => {
    const { page = 1, limit = 12, type } = params;
    return apiService.get('user/content', {
      page,
      limit,
      ...(type && { type }),
    });
  },
  getContentById: async (contentId: string): Promise<ApiResponse<any>> =>
    apiService.get(`user/content/${contentId}`),
  deleteContent: async (contentId: string): Promise<ApiResponse<any>> =>
    apiService.delete(`user/content/${contentId}`),
  checkContent: async (params: CheckContentParams): Promise<ApiResponse<any>> =>
    apiService.get('user/content/check', params),
};

export default ContentListService;

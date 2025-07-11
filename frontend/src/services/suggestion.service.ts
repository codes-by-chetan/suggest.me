/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiResponse } from '@/interfaces/api/api-response.interface';
import api from './api.service';

interface SuggestContentParams {
  content: { [key: string]: any };
  note: string;
  recepients: { [key: string]: any }[];
  [key: string]: any;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  type?: string;
}

// Submits a content suggestion
export const suggestContent = async (data: SuggestContentParams, params: any = {}): Promise<ApiResponse<any>> => {
  return api.post<ApiResponse<any>>('suggestions/suggest', data, params);
};

// Retrieves details for a specific suggestion
export const getSuggestionDetails = async (id: string, params: any = {}): Promise<ApiResponse<any>> => {
  return api.get<ApiResponse<any>>(`suggestions/suggestion/details/${id}`, params);
};

// Fetches suggestions made by the user
export const getSuggestedByYou = async ({
  page = 1,
  limit = 12,
  type,
}: PaginationParams = {}): Promise<ApiResponse<any>> => {
  return api.get<ApiResponse<any>>('suggestions/suggested/by/you', { page, limit, type });
};

// Fetches suggestions made for the user
export const getSuggestedToYou = async ({
  page = 1,
  limit = 12,
  type,
}: PaginationParams = {}): Promise<ApiResponse<any>> => {
  return api.get<ApiResponse<any>>('suggestions/suggested/to/you', { page, limit, type });
};
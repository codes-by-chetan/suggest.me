import {
  GlobalSearchResponse,
  PeopleSearchResponse,
} from '@/interfaces/api/search.interface';
import api from './api.service';

interface SearchParams {
  searchType?: string;
  searchTerm: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  contentTypes?: string[];
}

interface PeopleSearchParams {
  searchTerm: string;
  page?: number;
  limit?: number;
}

// Performs a global search across all models (movies, series, books, videos, people, etc.)
export const globalSearch = async ({
  searchType = 'all',
  searchTerm,
  page = 1,
  limit = 10,
  sortBy = 'relevance',
  contentTypes = [],
}: SearchParams) =>
  api.get<GlobalSearchResponse['data']>(`/search/global/${searchType}`, {
    search: searchTerm,
    page,
    limit,
    sortBy,
    contentTypes: contentTypes.length ? contentTypes.join(',') : undefined,
  });

// Searches for people (users or Person model entities)
export const searchPeople = async ({
  searchTerm,
  page = 1,
  limit = 10,
}: PeopleSearchParams) =>
  api.get<PeopleSearchResponse['data']>('/search/users', {
    search: searchTerm,
    page,
    limit,
  });

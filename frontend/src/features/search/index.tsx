/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ApiResponse } from '@/interfaces/api/api-response.interface';
import {
  GSearchResults,
  PeopleSearchResult,
} from '@/interfaces/api/search.interface';
import type { SearchResultItem } from '@/interfaces/search.interface';
import { globalSearch, searchPeople } from '@/services/search.service';
import { useInfiniteScroll } from '@/context/use-infinite-scroll';
import { useMobile } from '@/context/use-mobile';
import { SearchInput } from './components/search-input';
import { SearchResults } from './components/search-results';
import { SearchTabs } from './components/search-tabs';

const LIMIT = 10;
const STORAGE_PREFIX = 'search_tab_';
const EXPIRATION_TIME = 60 * 60 * 1000;

export type TabType = {
  label: string;
  value: string;
};

export type TabDataType = {
  results: SearchResultItem[];
  totalResults: number;
  totalPages: number;
  hasMore: boolean;
  page: number;
  imageFailed: boolean[];
};

export type TabDataWithSearchState = {
  results?: SearchResultItem[];
  totalResults?: number;
  totalPages?: number;
  hasMore?: boolean;
  page?: number;
  imageFailed?: boolean[];
  hasSearched?: boolean;
};

export default function SearchPage() {
  const tabs: TabType[] = [
    { label: 'All', value: 'all' },
    { label: 'Users', value: 'users' },
    { label: 'Movies', value: 'movie' },
    { label: 'Series', value: 'series' },
    { label: 'Music', value: 'music' },
    { label: 'Books', value: 'book' },
  ];

  const { q } = useSearch({ from: '/_authenticated/search/' });
  const navigate = useNavigate();
  const isMobile = useMobile();

  const [searchTerm, setSearchTerm] = useState<string>(q || '');

  const getInitialTab = () => {
    if (q) {
      const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${q}`);
      if (stored) {
        const { tab, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < EXPIRATION_TIME) {
          const validTab = tabs.find((t) => t.value === tab);
          return validTab ? tab : 'all';
        }
      }
    }
    return 'all';
  };

  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState<string>(searchTerm);
  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchEmpty, setIsSearchEmpty] = useState<boolean>(true);

  const [tabData, setTabData] = useState<{
    [key: string]: TabDataType;
  }>(
    tabs.reduce(
      (acc, tab) => {
        acc[tab.value] = {
          results: [],
          totalResults: 0,
          totalPages: 0,
          hasMore: true,
          page: 1,
          imageFailed: [],
        };
        return acc;
      },
      {} as Record<string, TabDataType>
    )
  );

  useEffect(() => {
    if (debouncedSearchTerm && activeTab) {
      sessionStorage.setItem(
        `${STORAGE_PREFIX}${debouncedSearchTerm}`,
        JSON.stringify({ tab: activeTab, timestamp: Date.now() })
      );
    }
  }, [activeTab, debouncedSearchTerm]);

  const updateDebouncedSearch = useCallback(
    debounce((value: string) => {
      if (value === debouncedSearchTerm) return;
      setDebouncedSearchTerm(value);
      setIsSearchEmpty(!value.trim());
      setHasSearched(!!value.trim());
      setTabData((prev) => {
        const newData = { ...prev };
        Object.keys(newData).forEach((key) => {
          newData[key] = {
            results: [],
            totalResults: 0,
            totalPages: 0,
            hasMore: true,
            page: 1,
            imageFailed: [],
          };
        });
        return newData;
      });

      navigate({
        to: "/search",
        search: (prev) =>
          value.trim() ? { ...prev, q: value } : { ...prev, q: undefined },
        replace: true,
      });
    }, 800),
    [navigate, debouncedSearchTerm]
  );

  useEffect(() => {
    updateDebouncedSearch(searchTerm);
  }, [searchTerm, updateDebouncedSearch]);

  useEffect(() => {
    fetchResults(activeTab, 1, false);
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchResults(activeTab, 1, false);
    }
  }, [debouncedSearchTerm, activeTab, hasSearched]);

  const fetchResults = async (
    tab: string,
    currentPage: number,
    append = false
  ) => {
    if (!debouncedSearchTerm) {
      setTabData((prev) => ({
        ...prev,
        [tab]: {
          results: [],
          totalResults: 0,
          totalPages: 0,
          hasMore: false,
          page: 1,
          imageFailed: [],
        },
      }));
      return;
    }

    setLoading(true);

    try {
      setError(null);
      if (tab === 'users') {
        const response: ApiResponse<PeopleSearchResult> = await searchPeople({
          searchTerm: debouncedSearchTerm,
          page: currentPage,
          limit: LIMIT,
        });

        const newResults = response.data?.results || [];

        setTabData((prev) => ({
          ...prev,
          [tab]: {
            results: append
              ? [...prev[tab].results, ...newResults]
              : newResults,
            totalResults: response.data?.pagination.totalResults || 0,
            totalPages: Math.ceil(
              (response.data?.pagination.totalResults || 0) / LIMIT
            ),
            hasMore:
              newResults.length > 0 &&
              currentPage <
                Math.ceil(
                  (response.data?.pagination.totalResults || 0) / LIMIT
                ),
            page: currentPage,
            imageFailed: append
              ? [
                  ...prev[tab].imageFailed,
                  ...Array(newResults.length).fill(false),
                ]
              : Array(newResults.length).fill(false),
          },
        }));
      } else {
        const contentTypes = tab === 'all' ? [] : [tab];
        const response: ApiResponse<GSearchResults> = await globalSearch({
          searchType: 'all',
          searchTerm: debouncedSearchTerm,
          page: currentPage,
          limit: LIMIT,
          contentTypes,
        });

        if (!response.success || !response.data)
          throw new Error('Invalid API Response');

        const searchResults = response.data.results;
        let combinedResults: SearchResultItem[] = [];

        if (tab === 'all') {
          (
            Object.keys(searchResults) as Array<keyof typeof searchResults>
          ).forEach((category) => {
            if (searchResults[category]?.data?.length) {
              combinedResults = [
                ...combinedResults,
                ...searchResults[category].data.map((item: any) => ({
                  ...item,
                  category,
                })),
              ];
            }
          });
        } else {
          combinedResults =
            searchResults[tab as keyof typeof searchResults]?.data || [];
        }

        setTabData((prev) => ({
          ...prev,
          [tab]: {
            results: append
              ? [...prev[tab].results, ...combinedResults]
              : combinedResults,
            totalResults: response.data?.pagination?.totalResults || 0,
            totalPages: response.data?.pagination?.totalPages || 0,
            hasMore:
              combinedResults.length > 0 &&
              currentPage < (response.data?.pagination?.totalPages || 0),
            page: currentPage,
            imageFailed: append
              ? [
                  ...prev[tab].imageFailed,
                  ...Array(combinedResults.length).fill(false),
                ]
              : Array(combinedResults.length).fill(false),
          },
        }));
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching results. Please try again.');
      setTabData((prev) => ({
        ...prev,
        [tab]: {
          results: append ? prev[tab].results : [],
          totalResults: 0,
          totalPages: 0,
          hasMore: false,
          page: currentPage,
          imageFailed: append ? prev[tab].imageFailed : [],
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loading && tabData[activeTab].hasMore) {
      const nextPage = tabData[activeTab].page + 1;
      fetchResults(activeTab, nextPage, true);
    }
  }, [loading, activeTab, tabData]);

  const { observerRef } = useInfiniteScroll(loadMore, {
    rootMargin: isMobile ? '300px' : '100px',
    threshold: isMobile ? 0.01 : 0.1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateDebouncedSearch(searchTerm);
  };

  const tabDataWithSearchState: any = {
    ...tabData,
    hasSearched,
  };

  return (
    <div className='relative mx-auto w-full max-w-[100%] overflow-x-hidden px-2 py-0 pb-10 sm:max-w-xl sm:p-2 sm:pb-0 md:max-w-2xl md:p-3 lg:max-w-7xl lg:p-4'>
      <SearchInput
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
      />
      {isMobile ? (
        <SearchTabs
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobile={isMobile}
          tabData={tabDataWithSearchState}
          setTabData={setTabData}
          loading={loading}
          hasSearched={hasSearched}
          observerRef={observerRef}
          error={error}
          isSearchEmpty={isSearchEmpty}
        />
      ) : (
        <>
          <SearchTabs
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobile={isMobile}
          />
          <SearchResults
            activeTab={activeTab}
            tabData={tabData}
            setTabData={setTabData}
            loading={loading}
            hasSearched={hasSearched}
            observerRef={observerRef}
            isMobile={isMobile}
            error={error}
          />
        </>
      )}
    </div>
  );
}

function debounce(func: (...args: any[]) => void, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

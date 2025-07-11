"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchInput } from "./search-input";
import { SearchTabs } from "./search-tabs";
import { SearchResults } from "./search-results";
import { globalSearch, searchPeople } from "@/services/search.service";
import type {
  GlobalSearchResponse,
  PeopleSearchResponse,
  SearchResultItem,
} from "@/interfaces/search.interface";
import { useMobile } from "@/lib/use-mobile";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";

// Define limit as a constant
const LIMIT = 10;
// SessionStorage key prefix and expiration time (1 hour in milliseconds)
const STORAGE_PREFIX = "search_tab_";
const EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour

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
    { label: "All", value: "all" },
    { label: "Users", value: "users" },
    { label: "Movies", value: "movie" },
    { label: "Series", value: "series" },
    { label: "Music", value: "music" },
    { label: "Books", value: "book" },
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMobile();

  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.get("q") || ""
  );
  const getInitialTab = () => {
    const searchTerm = searchParams.get("q") || "";
    if (searchTerm) {
      const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${searchTerm}`);
      if (stored) {
        const { tab, timestamp } = JSON.parse(stored);
        // Check if entry is not expired
        if (Date.now() - timestamp < EXPIRATION_TIME) {
          const validTab = tabs.find((t) => t.value === tab);
          return validTab ? tab : "all";
        }
      }
    }
    return "all";
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
  }>({
    all: {
      results: [],
      totalResults: 0,
      totalPages: 0,
      hasMore: true,
      page: 1,
      imageFailed: [],
    },
    users: {
      results: [],
      totalResults: 0,
      totalPages: 0,
      hasMore: true,
      page: 1,
      imageFailed: [],
    },
    movie: {
      results: [],
      totalResults: 0,
      totalPages: 0,
      hasMore: true,
      page: 1,
      imageFailed: [],
    },
    series: {
      results: [],
      totalResults: 0,
      totalPages: 0,
      hasMore: true,
      page: 1,
      imageFailed: [],
    },
    music: {
      results: [],
      totalResults: 0,
      totalPages: 0,
      hasMore: true,
      page: 1,
      imageFailed: [],
    },
    book: {
      results: [],
      totalResults: 0,
      totalPages: 0,
      hasMore: true,
      page: 1,
      imageFailed: [],
    },
  });
  
  // Update SessionStorage when activeTab changes
  useEffect(() => {
    if (debouncedSearchTerm && activeTab) {
      sessionStorage.setItem(
        `${STORAGE_PREFIX}${debouncedSearchTerm}`,
        JSON.stringify({ tab: activeTab, timestamp: Date.now() })
      );
    }
  }, [activeTab, debouncedSearchTerm]);
  // Debounce search term update
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
      // Update URL query parameter
      if (value.trim()) {
        setSearchParams({ q: value });
      } else {
        setSearchParams({});
      }
    }, 800),
    [setSearchParams]
  );

  useEffect(() => {
    updateDebouncedSearch(searchTerm);
  }, [searchTerm, updateDebouncedSearch]);

  useEffect(() => {
    fetchResults(activeTab, 1, false);
  }, []);

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
      setError(null); // Reset error state before fetching
      if (tab === "users") {
        // Fetch user search results
        const response: PeopleSearchResponse = await searchPeople({
          searchTerm: debouncedSearchTerm,
          page: currentPage,
          limit: LIMIT,
        });

        const newResults = response.data.results || [];

        setTabData((prev) => ({
          ...prev,
          [tab]: {
            results: append
              ? [...prev[tab].results, ...newResults]
              : newResults,
            totalResults: response.data.pagination.totalResults || 0,
            totalPages: Math.ceil(
              (response.data.pagination.totalResults || 0) / LIMIT
            ),
            hasMore:
              newResults.length > 0 &&
              currentPage <
                Math.ceil((response.data.pagination.totalResults || 0) / LIMIT),
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
        // Fetch global search results
        const contentTypes = tab === "all" ? [] : [tab];

        const response: GlobalSearchResponse = await globalSearch({
          searchType: "all",
          searchTerm: debouncedSearchTerm,
          page: currentPage,
          limit: LIMIT,
          contentTypes,
        });

        const searchResults = response.data?.results || {};
        let combinedResults: SearchResultItem[] = [];

        if (tab === "all") {
          Object.keys(searchResults).forEach((category) => {
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
          combinedResults = searchResults[tab]?.data || [];
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
      setError("An error occurred while fetching results. Please try again.");
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

  // Fetch results on tab switch or search term change
  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchResults(activeTab, 1, false);
    }
  }, [debouncedSearchTerm, activeTab, hasSearched]);

  // Setup infinite scroll
  const loadMore = useCallback(() => {
    if (!loading && tabData[activeTab].hasMore) {
      const nextPage = tabData[activeTab].page + 1;
      fetchResults(activeTab, nextPage, true);
    }
  }, [loading, activeTab, tabData]);

  const { observerRef } = useInfiniteScroll(loadMore, {
    rootMargin: isMobile ? "300px" : "100px", // Larger margin for mobile
    threshold: isMobile ? 0.01 : 0.1, // Lower threshold for mobile
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateDebouncedSearch(searchTerm);
  };

  // Create tabData with hasSearched for mobile view
  const tabDataWithSearchState: TabDataWithSearchState = {
    ...tabData,
    hasSearched,
  };

  return (
    <div className="relative pb-10 sm:pb-0 px-2 py-0 sm:p-2 md:p-3 lg:p-4 w-full max-w-[100%] sm:max-w-xl md:max-w-2xl lg:max-w-7xl mx-auto overflow-x-hidden">
      {/* Search Input */}
      <SearchInput
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
      />

      {/* Conditional Rendering Based on Screen Size */}
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

// Debounce function
function debounce(func: (...args: any[]) => void, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

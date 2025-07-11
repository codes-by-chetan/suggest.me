"use client";

import type React from "react";

import { motion } from "framer-motion";
import { SearchResultItemComponent } from "./search-result-item";
import { Loader2 } from "lucide-react";
import type { TabDataType } from "./search-page";
import { cn } from "@/lib/utils";
import { SearchSkeleton } from "./search-skeleton";

interface SearchResultsProps {
  activeTab: string;
  tabData: { [key: string]: TabDataType };
  setTabData: React.Dispatch<
    React.SetStateAction<{ [key: string]: TabDataType }>
  >;
  loading: boolean;
  hasSearched: boolean;
  observerRef: React.RefObject<HTMLDivElement>;
  isMobile: boolean;
  error: string | null;
}

export function SearchResults({
  activeTab,
  tabData,
  setTabData,
  loading,
  hasSearched,
  observerRef,
  isMobile,
  error,
}: SearchResultsProps) {
  const currentTabData = tabData[activeTab];

  // Helper functions
  const getPosterUrl = (item: any): string => {
    if (item.poster) {
      return typeof item.poster === "object" ? item.poster.url : item.poster;
    }
    if (item.coverImage) {
      return typeof item.coverImage === "object"
        ? item.coverImage?.url
        : item.coverImage;
    }
    
    return "";
  };

  const handleImageError = (index: number) => {
    setTabData((prev) => {
      const newData = { ...prev };
      const newFailed = [...newData[activeTab].imageFailed];
      newFailed[index] = true;
      newData[activeTab].imageFailed = newFailed;
      return newData;
    });
  };

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "w-full min-w-full max-w-full flex-shrink-0 flex flex-col",
        isMobile ? "min-h-[calc(100vh-180px)]" : "min-h-[calc(100vh-120px)]"
      )}
    >
      <div className="w-full px-2 space-y-2">
        {loading && currentTabData.results.length === 0 ? (
          <div className="py-4">
            <SearchSkeleton />
          </div>
        ) : currentTabData.results.length > 0 ? (
          <div className="space-y-2">
            {currentTabData.results.map((item, index) => (
              <SearchResultItemComponent
                key={`${
                  item._id ||
                  item.imdbId ||
                  item.googleBooksId ||
                  item.spotifyId
                }-${index}`}
                item={item}
                index={index}
                activeTab={activeTab}
                imageFailed={currentTabData.imageFailed[index]}
                getPosterUrl={getPosterUrl}
                onImageError={() => handleImageError(index)}
              />
            ))}

            {loading && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="ml-2 text-sm text-muted-foreground">
                  Loading more...
                </p>
              </div>
            )}

            {/* Infinite scroll observer element */}
            <div ref={observerRef} className="h-4 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full w-full py-8">
            <p className="text-center text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full w-full py-8">
            <p className="text-center text-sm">
              {activeTab === "all" && !hasSearched
                ? "Please search to see results."
                : "No results found."}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

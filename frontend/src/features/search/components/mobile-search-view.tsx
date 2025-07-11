"use client";

import type React from "react";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  TabType,
  TabDataType,
  TabDataWithSearchState,
} from "./search-page";
import { SearchSkeleton } from "./search-skeleton";
import { Loader2 } from "lucide-react";
import { SearchResultItemComponent } from "./search-result-item";

interface MobileSearchViewProps {
  tabs: TabType[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabData: TabDataWithSearchState;
  setTabData: React.Dispatch<
    React.SetStateAction<{ [key: string]: TabDataType }>
  >;
  loading: boolean;
  hasSearched: boolean;
  observerRef: React.RefObject<HTMLDivElement>;
  error: string | null;
  isSearchEmpty: boolean;
}

export function MobileSearchView({
  tabs,
  activeTab,
  setActiveTab,
  tabData,
  setTabData,
  loading,
  hasSearched,
  observerRef,
  error,
  isSearchEmpty,
}: MobileSearchViewProps) {
  const [startX, setStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX !== null) {
      const currentX = e.touches[0].clientX;
      const diff = Math.abs(startX - currentX);

      // If user has moved more than 10px horizontally, consider it a drag
      if (diff > 10) {
        setIsDragging(true);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX !== null && isDragging) {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      const threshold = 50; // Minimum swipe distance

      if (Math.abs(diff) > threshold) {
        const currentIndex = tabs.findIndex((tab) => tab.value === activeTab);

        if (diff > 0 && currentIndex < tabs.length - 1) {
          // Swipe left -> next tab
          setActiveTab(tabs[currentIndex + 1].value);
        } else if (diff < 0 && currentIndex > 0) {
          // Swipe right -> previous tab
          setActiveTab(tabs[currentIndex - 1].value);
        }
      }
    }

    // Reset values
    setStartX(null);
    setIsDragging(false);
  };

  // Framer Motion swipe handler as backup
  const handleSwipe = (offset: number) => {
    const currentIndex = tabs.findIndex((tab) => tab.value === activeTab);
    const swipeThreshold = 50;

    if (offset < -swipeThreshold && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].value);
    } else if (offset > swipeThreshold && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].value);
    }
  };

  // Get appropriate empty state message
  const getEmptyStateMessage = () => {
    if (isSearchEmpty) {
      return "Type something to search for content...";
    }
    if (!hasSearched && activeTab === "all") {
      return "Please search to see results.";
    }
    return "No results found.";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar - Instagram Style */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex justify-between overflow-x-auto scrollbar-hide pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              variant="ghost"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 text-xs font-normal rounded-full transition-all duration-200",
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Indicator */}
        <div className="flex justify-center gap-1 mt-2">
          {tabs.map((tab) => (
            <div
              key={tab.value}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                activeTab === tab.value ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Results Container with Swipe - Full Height */}
      <div
        className="flex-1 relative overflow-hidden min-h-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          ref={containerRef}
          className="h-full w-full"
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset }) => handleSwipe(offset.x)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full min-h-[calc(100vh-200px)] w-full flex flex-col"
            >
              {loading && currentTabData.results.length === 0 ? (
                <div className="flex-1 px-2 py-4 min-h-[calc(100vh-250px)">
                  <SearchSkeleton />
                </div>
              ) : currentTabData.results.length > 0 ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="px-2 space-y-2 pb-4">
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
                    {/* Infinite scroll observer element - Improved for mobile */}
                  </div>
                </div>
              ) : (
                <div className="flex-1 h-full flex items-center justify-center px-4 min-h-[calc(100vh-250px)]">
                  {error ? (
                    <p className="text-center text-sm text-destructive">
                      {error}
                    </p>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      {getEmptyStateMessage()}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      <div
        ref={observerRef}
        className="h-8 w-full"
        style={{ minHeight: "32px" }}
      />
      {/* Extra padding for mobile scroll detection */}
      <div className="h-16 w-full" />
    </div>
  );
}

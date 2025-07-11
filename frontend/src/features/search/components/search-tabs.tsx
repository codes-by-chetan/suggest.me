"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TabType, TabDataType, TabDataWithSearchState } from "./search-page"
import { MobileSearchView } from "./mobile-search-view"

interface SearchTabsProps {
  tabs: TabType[]
  activeTab: string
  setActiveTab: (tab: string) => void
  isMobile: boolean
  // Add props for mobile view
  tabData?: TabDataWithSearchState
  setTabData?: React.Dispatch<React.SetStateAction<{ [key: string]: TabDataType }>>
  loading?: boolean
  hasSearched?: boolean
  observerRef?: React.RefObject<HTMLDivElement>
  error?: string | null
  isSearchEmpty?: boolean
}

export function SearchTabs({
  tabs,
  activeTab,
  setActiveTab,
  isMobile,
  tabData,
  setTabData,
  loading,
  hasSearched,
  observerRef,
  error,
  isSearchEmpty,
}: SearchTabsProps) {
  // If mobile and we have all the required props, render the full mobile view
  if (isMobile && tabData && setTabData && observerRef !== undefined) {
    return (
      <MobileSearchView
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabData={tabData}
        setTabData={setTabData}
        loading={loading || false}
        hasSearched={hasSearched || false}
        observerRef={observerRef}
        error={error || null}
        isSearchEmpty={isSearchEmpty || false}
      />
    )
  }

  // Desktop view
  return (
    <div className="mb-4 w-full max-w-[100%] overflow-x-hidden flex items-center justify-center">
      <div className="flex flex-row gap-4 overflow-x-auto snap-x snap-mandatory whitespace-nowrap  max-w-[100%] pb-1">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? "default" : "outline"}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "snap-center px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-2.5 text-xs sm:text-xs md:text-sm lg:text-base rounded-full min-w-[40px] sm:min-w-[50px] lg:min-w-[60px] flex-shrink-0 box-border",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-accent",
            )}
            aria-current={activeTab === tab.value ? "true" : "false"}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

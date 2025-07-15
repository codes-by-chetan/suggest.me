import type React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TabDataType, TabType } from '..';
import { MobileSearchView } from './mobile-search-view';

interface SearchTabsProps {
  tabs: TabType[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile: boolean;
  // Add props for mobile view
  tabData?: {
    [key: string]: TabDataType;
  };
  setTabData?: React.Dispatch<
    React.SetStateAction<{ [key: string]: TabDataType }>
  >;
  loading?: boolean;
  hasSearched?: boolean;
  observerRef?: React.RefObject<HTMLDivElement | null>;
  error?: string | null;
  isSearchEmpty?: boolean;
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
    );
  }

  // Desktop view
  return (
    <div className='mb-4 flex w-full max-w-[100%] items-center justify-center overflow-x-hidden'>
      <div className='flex max-w-[100%] snap-x snap-mandatory flex-row gap-4 overflow-x-auto pb-1 whitespace-nowrap'>
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'box-border min-w-[40px] flex-shrink-0 snap-center rounded-full px-2 py-1 text-xs sm:min-w-[50px] sm:px-3 sm:py-2 sm:text-xs md:text-sm lg:min-w-[60px] lg:px-4 lg:py-2.5 lg:text-base',
              activeTab === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-accent'
            )}
            aria-current={activeTab === tab.value ? 'true' : 'false'}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

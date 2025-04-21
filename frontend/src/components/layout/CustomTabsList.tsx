/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Film, BookOpen, Tv, Music, Youtube, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '../ui/button'
import { MySuggestionContentItem } from './data/mySuggestions'
import { WatchListContentItem } from './data/myWatchListItems'
import { ContentItem } from './data/contentItem'

interface CustomTabsListProps {
  activeTab: string
  setActiveTab: (value: string) => void
  filteredSuggestions: MySuggestionContentItem[] | WatchListContentItem[] | ContentItem[]
  handleMarkAsWatched: (id: string) => void
  handleMarkAsWatching: (id: string) => void
  handleAddToWatchlist: (id: string) => void
  handleRemoveFromMyWatchList: (id: string) => void
  CustomCard: React.ElementType
  myWatchList?: boolean
}

export const CustomTabsList = ({
  activeTab,
  setActiveTab,
  filteredSuggestions,
  handleMarkAsWatched,
  handleMarkAsWatching,
  handleAddToWatchlist = (id: string | number) => {},
  handleRemoveFromMyWatchList = (id: string | number) => {},
  CustomCard,
  myWatchList = false,
}: CustomTabsListProps) => {
  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'movie', label: 'Movies', icon: Film },
    { value: 'book', label: 'Books', icon: BookOpen },
    { value: 'anime', label: 'Anime', icon: Tv },
    { value: 'song', label: 'Songs', icon: Music },
    { value: 'youtube', label: 'Videos', icon: Youtube },
  ]

  return (
    <Tabs
      defaultValue='all'
      value={activeTab}
      onValueChange={(value:any) => {
        setActiveTab(value)
      }}
      className='w-full pb-4'
    >
      <TabsList className='w-full dark:bg-muted/50 mb-8 grid grid-cols-6 rounded-full bg-slate-200/60 p-1'>
        {tabs.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className={` data-[state=active]:dark:bg-blue-500 flex items-center gap-2 rounded-full data-[state=active]:bg-white`}
          >
            {Icon && <Icon className='h-4 w-4' />}
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={activeTab} className='mt-0'>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((item) => (
              <CustomCard
                key={item.id}
                item={item}
                myWatchlist={myWatchList}
                handleMarkAsWatched={handleMarkAsWatched}
                handleMarkAsWatching={handleMarkAsWatching}
                handleAddToWatchlist={handleAddToWatchlist}
                handleRemoveFromList={handleRemoveFromMyWatchList}
              />
            ))
          ) : (
            <div className='bg-card shadow-social dark:shadow-social-dark col-span-full rounded-lg p-8 py-12 text-center'>
              <div className='bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full'>
                <Film className='text-primary h-8 w-8' />
              </div>
              <h3 className='text-foreground mb-2 text-xl font-semibold'>
                No suggestions yet
              </h3>
              <p className='text-muted-foreground mx-auto mb-6 max-w-md'>
                You don't have any suggestions in this category yet. Ask your
                friends to recommend something!
              </p>
              <Button className='gap-2 rounded-full'>
                <Plus className='h-4 w-4' />
                Ask for Recommendations
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}

export default TabsList

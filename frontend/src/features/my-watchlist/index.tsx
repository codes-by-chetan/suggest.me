/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { CheckCircle, Clock, Bookmark, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CustomTabsList } from '@/components/layout/CustomTabsList'
import MyWatchListCard from '@/components/layout/MyWatchListCard'
import { myWatchListItems } from '@/components/layout/data/myWatchListItems'

const MyWatchlist = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [watchListItems, setWatchlistItems] = useState(myWatchListItems)

  // Filter by content type and status
  const filteredItems = watchListItems
    .filter((item) => activeTab === 'all' || item.type === activeTab)
    .filter((item) => statusFilter === null || item.status === statusFilter)

  const getStatusText = (status: string | null, type: string = '') => {
    if (!status) return ''

    // For filter dropdown where we don't have the type
    if (!type) {
      switch (status) {
        case 'watched':
        case 'finished':
        case 'listened':
          return 'Completed'
        case 'watching':
        case 'reading':
        case 'listening':
          return 'In Progress'
        case 'watchlist':
        case 'readlist':
        case 'listenlist':
          return 'In List'
        default:
          return ''
      }
    }

    // When we have the content type
    switch (type) {
      case 'book':
        return status === 'finished'
          ? 'Finished'
          : status === 'reading'
            ? 'Currently Reading'
            : status === 'readlist'
              ? 'In Reading List'
              : ''
      case 'song':
        return status === 'listened'
          ? 'Listened'
          : status === 'listening'
            ? 'Currently Listening'
            : status === 'listenlist'
              ? 'In Listening List'
              : ''
      default:
        return status === 'watched'
          ? 'Watched'
          : status === 'watching'
            ? 'Currently Watching'
            : status === 'watchlist'
              ? 'In Watchlist'
              : ''
    }
  }

  // Update status handler
  const handleUpdateStatus = (id: string, newStatus: string | null) => {
    setWatchlistItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, status: newStatus as any }
        }
        return item
      })
    )
  }

  return (
    <div className='bg-background min-h-screen'>
      <main className='mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8'>
        <div className='pb-6'>
          <div className='mb-8 flex items-center justify-between'>
            <h1 className='text-foreground text-3xl font-bold'>
              My <span className='text-primary'>Collections</span>
            </h1>
            <div className='flex gap-2'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='gap-2 rounded-full'>
                    <Filter className='h-4 w-4' />
                    {statusFilter
                      ? getStatusText(statusFilter)
                      : 'All Statuses'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('watched')}>
                    <CheckCircle className='mr-2 h-4 w-4 text-green-500' />
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('watching')}>
                    <Clock className='mr-2 h-4 w-4 text-amber-500' />
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter('watchlist')}
                  >
                    <Bookmark className='mr-2 h-4 w-4 text-blue-500' />
                    In List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <CustomTabsList
            activeTab={activeTab}
            CustomCard={MyWatchListCard}
            setActiveTab={setActiveTab}
            filteredSuggestions={filteredItems}
            handleMarkAsWatched={(id: string) =>
              handleUpdateStatus(id, 'watched')
            }
            handleMarkAsWatching={(id: string) =>
              handleUpdateStatus(id, 'watching')
            }
            handleAddToWatchlist={() => {}}
            handleRemoveFromMyWatchList={(id: string) =>
              handleUpdateStatus(id, 'remove')
            }
            myWatchList={true}
          />
        </div>
      </main>
    </div>
  )
}

export default MyWatchlist

import { useNavigate } from '@tanstack/react-router'
import {
  Film,
  BookOpen,
  Tv,
  Music,
  Youtube,
  Instagram,
  CheckCircle,
  Clock,
  Bookmark,
  Trash,
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { WatchListContentItem } from './data/myWatchListItems'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

const MyWatchListCard = ({
  item,
  handleMarkAsWatched,
  handleMarkAsWatching,
  handleRemoveFromList,
}: {
  item: WatchListContentItem
  handleMarkAsWatched: (id: number | string) => void
  handleMarkAsWatching: (id: number | string) => void
  handleRemoveFromList: (id: number | string) => void
}) => {
  const navigate = useNavigate()

  const getIconForType = (type: string) => {
    switch (type) {
      case 'movie':
        return <Film className='h-5 w-5' />
      case 'book':
        return <BookOpen className='h-5 w-5' />
      case 'anime':
        return <Tv className='h-5 w-5' />
      case 'song':
        return <Music className='h-5 w-5' />
      case 'youtube':
        return <Youtube className='h-5 w-5' />
      case 'reels':
        return <Instagram className='h-5 w-5' />
      default:
        return <Film className='h-5 w-5' />
    }
  }

  const getStatusIcon = (status: string | null) => {
    if (!status) return null

    // Completed statuses
    if (['watched', 'finished', 'listened'].includes(status)) {
      return <CheckCircle className='h-4 w-4 text-green-500' />
    }

    // In progress statuses
    if (['watching', 'reading', 'listening'].includes(status)) {
      return <Clock className='h-4 w-4 text-amber-500' />
    }

    // List statuses
    if (['watchlist', 'readlist', 'listenlist'].includes(status)) {
      return <Bookmark className='h-4 w-4 text-blue-500' />
    }

    return null
  }

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

  const getStatusColor = (status: string | null) => {
    if (!status) return ''

    // Completed statuses
    if (['watched', 'finished', 'listened'].includes(status)) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    }

    // In progress statuses
    if (['watching', 'reading', 'listening'].includes(status)) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
    }

    // List statuses
    if (['watchlist', 'readlist', 'listenlist'].includes(status)) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    }

    return ''
  }

  // const handleUpdateStatus = (id: string, newStatus: string | null) => {
  //   // Update the local state with the new status
  //   setWatchlistItems((prev) =>
  //     prev.map((item) => {
  //       if (item.id === id) {
  //         return { ...item, status: newStatus as status }
  //       }
  //       return item
  //     })
  //   )
  // }

  // const getContentSpecificStatusLabel = (
  //   status: string,
  //   type: string
  // ): string => {
  //   if (status === 'watchlist') return 'In Watchlist'
  //   if (status === 'readlist') return 'In Reading List'
  //   if (status === 'listenlist') return 'In Listening List'

  //   switch (type) {
  //     case 'book':
  //       return status === 'finished' ? 'Finished' : 'Reading'
  //     case 'song':
  //       return status === 'listened' ? 'Listened' : 'Listening'
  //     default:
  //       return status === 'watched' ? 'Watched' : 'Watching'
  //   }
  // }

  return (
    <Card
      key={item.id}
      className='shadow-social dark:shadow-social-dark hover:shadow-social-hover dark:hover:shadow-social-dark-hover cursor-pointer overflow-hidden border-0 transition-all'
    >
      <div className='flex h-full flex-col'>
        {item.imageUrl && (
          <div
            className='bg-muted relative h-40 w-full'
            onClick={() => navigate({ to: `/content/${item.id}` })}
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className='h-full w-full object-cover'
            />
            {item.status && (
              <Badge
                className={`absolute top-2 right-2 flex items-center gap-1 ${getStatusColor(
                  item.status
                )}`}
              >
                {getStatusIcon(item.status)}
                {getStatusText(item.status, item.type)}
              </Badge>
            )}
          </div>
        )}
        <CardContent className='flex-1 p-5'>
          <div className='mb-3 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 dark:bg-primary/20 rounded-full p-1.5'>
                {getIconForType(item.type)}
              </div>
              <span className='text-primary text-xs font-medium capitalize'>
                {item.type}
              </span>
            </div>
            <span className='text-muted-foreground text-xs'>
              {new Date(item.addedAt).toLocaleDateString()}
            </span>
          </div>
          <h3
            className='mb-1 line-clamp-1 text-lg font-semibold'
            onClick={() => navigate({ to: `/content/${item.id}` })}
          >
            {item.title}
          </h3>
          <p className='text-muted-foreground mb-2 text-sm'>
            {item.creator} • {item.year}
          </p>
          <p className='mb-4 line-clamp-2 text-sm'>{item.description}</p>

          {/* Status update buttons */}
          <div className='mb-4 flex items-center justify-between'>
            <Button
              variant={
                ['watched', 'finished', 'listened'].includes(item.status || '')
                  ? 'default'
                  : 'ghost'
              }
              size='sm'
              className='h-auto rounded-full p-2'
              onClick={() => {
                // const completedStatus =
                //   item.type === 'book'
                //     ? 'finished'
                //     : item.type === 'song'
                //       ? 'listened'
                //       : 'watched'
                // handleUpdateStatus(item.id, completedStatus)
                handleMarkAsWatched(item.id)
              }}
            >
              <CheckCircle
                className={`h-4 w-4 ${
                  ['watched', 'finished', 'listened'].includes(
                    item.status || ''
                  )
                    ? 'text-white'
                    : 'text-muted-foreground'
                }`}
                onClick={() => handleMarkAsWatched(item.id)}
              />
            </Button>
            <Button
              variant={
                ['watching', 'reading', 'listening'].includes(item.status || '')
                  ? 'default'
                  : 'ghost'
              }
              size='sm'
              className='h-auto rounded-full p-2'
              onClick={() => {
                // const inProgressStatus =
                //   item.type === 'book'
                //     ? 'reading'
                //     : item.type === 'song'
                //       ? 'listening'
                //       : 'watching'
                // handleUpdateStatus(item.id, inProgressStatus)
                handleMarkAsWatching(item.id)
              }}
            >
              <Clock
                className={`h-4 w-4 ${
                  ['watching', 'reading', 'listening'].includes(
                    item.status || ''
                  )
                    ? 'text-white'
                    : 'text-muted-foreground'
                }`}
              />
            </Button>
            <Button
              variant={
                ['watchlist', 'readlist', 'listenlist'].includes(
                  item.status || ''
                )
                  ? 'default'
                  : 'ghost'
              }
              size='sm'
              className='h-auto rounded-full p-2'
              onClick={() => {
                // const listStatus =
                //   item.type === 'book'
                //     ? 'readlist'
                //     : item.type === 'song'
                //       ? 'listenlist'
                //       : 'watchlist'
                // handleUpdateStatus(item.id, listStatus)
                handleRemoveFromList(item.id)
              }}
            >
              <Trash
                className={`h-4 w-4 ${
                  ['watchlist', 'readlist', 'listenlist'].includes(
                    item.status || ''
                  )
                    ? 'text-white'
                    : 'text-muted-foreground'
                }`}
              />
            </Button>
          </div>

          <div className='border-border flex flex-col border-t pt-3'>
            <span className='text-foreground mb-2 text-xs font-medium'>
              Suggested by:
            </span>
            <div className='bg-accent hover:bg-accent/80 flex w-fit items-center rounded-full px-2 py-1 transition-colors'>
              <Avatar className='ring-primary/20 mr-1 h-5 w-5 ring-1'>
                <AvatarImage
                  src={item.suggestedBy.avatar}
                  alt={item.suggestedBy.name}
                />
                <AvatarFallback className='bg-primary-100 text-primary-800'>
                  {item.suggestedBy.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className='text-xs font-medium'>
                {item.suggestedBy.name}
              </span>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

export default MyWatchListCard

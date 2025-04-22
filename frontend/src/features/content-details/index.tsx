/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useRouter } from '@tanstack/react-router'
import {
  Film,
  BookOpen,
  Tv,
  Music,
  Youtube,
  Instagram,
  ArrowLeft,
  ExternalLink,
  Clock,
  Bookmark,
  CheckCircle,
  Heart,
  MessageCircle,
  Share2,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { contentItemArray } from '@/components/layout/data/contentItem'
import {
  mockFriendActivity,
  mockRecommended,
  mockTrending,
} from '@/components/layout/data/exploreSection'
import {
  mockMySuggestions,
  Recipient,
} from '@/components/layout/data/mySuggestions'

const ContentDetailsPage = () => {
  const id = useParams({ from: '/_authenticated/content/$id/' }).id
  const router = useRouter()
  let contentDetails = contentItemArray.find((item) => item.id === id)
  if (!contentDetails) {
    contentDetails = mockTrending.find((item) => item.id === id)
  }
  if (!contentDetails) {
    contentDetails = mockRecommended.find((item) => item.id === id)
  }
  if (!contentDetails) {
    contentDetails = mockFriendActivity.find((item) => item.id === id)
  }
  if (!contentDetails) {
    contentDetails = mockMySuggestions.find((item) => item.id === id)
  }

  if (!contentDetails) {
    return (
      <div className='bg-background min-h-screen'>
        <main className='mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8'>
          <div className='py-6'>
            <Button
              variant='ghost'
              className='mb-4'
              onClick={() => router.history.back()}
            >
              <ArrowLeft className='mr-2 h-4 w-4' /> Back
            </Button>
            <div className='py-12 text-center'>
              <h2 className='text-2xl font-bold'>Content not found</h2>
              <p className='text-muted-foreground mt-2'>
                The content you're looking for doesn't exist or couldn't be
                loaded.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

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

  const getContentSpecificStatusLabel = (
    status: string,
    type: string
  ): string => {
    if (status === 'watchlist') return 'In Watchlist'
    if (status === 'readlist') return 'In Reading List'
    if (status === 'listenlist') return 'In Listening List'

    switch (type) {
      case 'book':
        return status === 'finished' ? 'Finished' : 'Reading'
      case 'song':
        return status === 'listened' ? 'Listened' : 'Listening'
      default:
        return status === 'watched' ? 'Watched' : 'Watching'
    }
  }

  const getWhereToConsume = () => {
    switch (contentDetails.type) {
      case 'book':
        return (
          contentDetails.whereToRead || [
            'Amazon',
            'Barnes & Noble',
            'Local Library',
          ]
        )
      case 'song':
        return (
          contentDetails.whereToListen || [
            'Spotify',
            'Apple Music',
            'YouTube Music',
          ]
        )
      default:
        return (
          contentDetails.whereToWatch || ['Netflix', 'Hulu', 'Amazon Prime']
        )
    }
  }

  const getWhereToConsumeLabel = () => {
    switch (contentDetails.type) {
      case 'book':
        return 'Where to Read'
      case 'song':
        return 'Where to Listen'
      default:
        return 'Where to Watch'
    }
  }

  return (
    <div className='bg-background min-h-screen'>

      <main className='mx-auto max-w-7xl px-4  sm:px-6 lg:px-8'>
        <div className='py-6'>
          <Button
            variant='ghost'
            className='mb-4'
            onClick={() => router.history.back()}
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
            {/* Left column - Image */}
            <div className='md:col-span-1'>
              <div className='bg-muted overflow-hidden rounded-lg shadow-lg'>
                {contentDetails.imageUrl ? (
                  <img
                    src={contentDetails.imageUrl}
                    alt={contentDetails.title}
                    className='h-auto w-full object-cover'
                  />
                ) : (
                  <div className='bg-primary/10 flex h-64 w-full items-center justify-center'>
                    {getIconForType(contentDetails.type)}
                  </div>
                )}
              </div>

              {/* Status indicator */}
              {contentDetails.status && (
                <div className='mt-4'>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${contentDetails.status === 'watched' || contentDetails.status === 'finished' || contentDetails.status === 'listened' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : contentDetails.status === 'watching' || contentDetails.status === 'reading' || contentDetails.status === 'listening' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}
                  >
                    {contentDetails.status === 'watched' ||
                    contentDetails.status === 'finished' ||
                    contentDetails.status === 'listened' ? (
                      <>
                        <CheckCircle className='mr-1 h-4 w-4' />
                        {getContentSpecificStatusLabel(
                          contentDetails.status,
                          contentDetails.type
                        )}
                      </>
                    ) : contentDetails.status === 'watching' ||
                      contentDetails.status === 'reading' ||
                      contentDetails.status === 'listening' ? (
                      <>
                        <Clock className='mr-1 h-4 w-4' />
                        {getContentSpecificStatusLabel(
                          contentDetails.status,
                          contentDetails.type
                        )}
                      </>
                    ) : (
                      <>
                        <Bookmark className='mr-1 h-4 w-4' />
                        {getContentSpecificStatusLabel(
                          contentDetails.status,
                          contentDetails.type
                        )}
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Where to watch/read/listen */}
              <div className='bg-card mt-6 rounded-lg p-4 shadow-sm'>
                <h3 className='mb-3 text-lg font-medium'>
                  {getWhereToConsumeLabel()}
                </h3>
                <div className='space-y-2'>
                  {getWhereToConsume().map((place, index) => (
                    <a
                      key={index}
                      href='#'
                      className='hover:bg-accent flex items-center justify-between rounded-md p-2 transition-colors'
                    >
                      <span>{place}</span>
                      <ExternalLink className='text-muted-foreground h-4 w-4' />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column - Content details */}
            <div className='md:col-span-2'>
              <div className='mb-2 flex items-center gap-2'>
                <div className='bg-primary/10 dark:bg-primary/20 rounded-full p-1.5'>
                  {getIconForType(contentDetails.type)}
                </div>
                <span className='text-primary text-sm font-medium capitalize'>
                  {contentDetails.type}
                </span>
              </div>

              <h1 className='mb-2 text-3xl font-bold'>
                {contentDetails.title}
              </h1>

              <p className='text-muted-foreground mb-4'>
                {contentDetails.creator} • {contentDetails.year}
              </p>

              <div className='mb-6'>
                <h2 className='mb-2 text-xl font-semibold'>Description</h2>
                <p className='text-foreground'>{contentDetails.description}</p>
              </div>

              {/* Social media style interaction buttons */}
              <div className='mb-6 flex items-center gap-4'>
                <Button
                  variant='outline'
                  size='sm'
                  className='gap-2 rounded-full'
                >
                  <Heart className='h-4 w-4' />
                  Like
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='gap-2 rounded-full'
                >
                  <MessageCircle className='h-4 w-4' />
                  Comment
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='gap-2 rounded-full'
                >
                  <Share2 className='h-4 w-4' />
                  Share
                </Button>
              </div>

              <Separator className='my-6' />

              {/* Suggested by or to section */}
              {contentDetails.suggestedBy && (
                <div className='mb-6'>
                  <h2 className='mb-3 text-lg font-semibold'>Suggested by</h2>
                  <div className='flex items-center'>
                    <Avatar className='ring-primary/20 mr-3 h-10 w-10 ring-2'>
                      <AvatarImage
                        src={contentDetails.suggestedBy.avatar}
                        alt={contentDetails.suggestedBy.name}
                      />
                      <AvatarFallback>
                        {contentDetails.suggestedBy.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-medium'>
                        {contentDetails.suggestedBy.name}
                      </p>
                      {contentDetails.suggestedAt && (
                        <p className='text-muted-foreground text-sm'>
                          {new Date(
                            contentDetails.suggestedAt
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {contentDetails.suggestedTo &&
                contentDetails.suggestedTo.length > 0 && (
                  <div>
                    <h2 className='mb-3 text-lg font-semibold'>Suggested to</h2>
                    <div className='flex flex-wrap gap-2'>
                      {contentDetails.suggestedTo.map(
                        (recipient: Recipient) => (
                          <div
                            key={recipient.id}
                            className='bg-accent hover:bg-accent/80 flex items-center rounded-full px-3 py-1 transition-colors'
                          >
                            <Avatar className='ring-primary/20 mr-2 h-6 w-6 ring-1'>
                              <AvatarImage
                                src={recipient.avatar}
                                alt={recipient.name}
                              />
                              <AvatarFallback>
                                {recipient.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className='text-sm font-medium'>
                              {recipient.name}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ContentDetailsPage

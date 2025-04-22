/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from '@tanstack/react-router'
import ExploreSection from '@/components/explore/ExploreSection'
import AppName from '@/components/layout/AppName'
import {
  ContentItem,
  contentItemArray,
} from '@/components/layout/data/contentItem'
import { Suggestor, suggestorsArray } from '@/components/layout/data/suggestors'
import SuggestionButton from '@/components/suggestions/SuggestionButton'
import SuggestionFlow from '@/components/suggestions/SuggestionFlow'
import SuggestorsList from '@/components/suggestors/SuggestorsList'
interface ContentDetails {
  id: string
  title: string
  type: string
  imageUrl?: string
  year?: string
  creator?: string
  description?: string
  status?:
    | 'watched'
    | 'watching'
    | 'watchlist'
    | 'finished'
    | 'reading'
    | 'listened'
    | 'listening'
    | 'readlist'
    | 'listenlist'
    | null
  suggestedBy?: {
    id: string
    name: string
    avatar?: string
  }
  suggestedTo?: {
    id: string
    name: string
    avatar?: string
  }[]
  suggestedAt?: string
  whereToWatch?: string[]
  whereToRead?: string[]
  whereToListen?: string[]
  [key: string]: any
}

interface ContentDetailsState {
  contentDetails: ContentDetails
}
const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true) // Mock authentication state
  const [isSuggestionFlowOpen, setIsSuggestionFlowOpen] = useState(false)
  const [recentSuggestions, setRecentSuggestions] =
    useState<ContentItem[]>(contentItemArray)
  const [suggestors, setSuggestors] = useState<Suggestor[]>(suggestorsArray)

  const navigate = useNavigate()

  // Mock function to fetch suggestors data and recent suggestions
  useEffect(() => {
    // In a real app, this would be an API call
    // fetchSuggestors().then(data => setSuggestors(data));
    // fetchRecentSuggestions().then(data => setRecentSuggestions(data));
  }, [])

  const handleSuggestorClick = (suggestor: Suggestor) => {
    // Navigate to suggestor's suggestions page
    console.log('Viewing suggestions from:', suggestor.name)
    // In a real app, this would navigate to a different route
    // navigate(`/suggestor/${suggestor.id}`);
  }

  const handleSuggestionComplete = (data: any) => {
    console.log('Suggestion completed:', data)
    setIsSuggestionFlowOpen(false)
    // In a real app, this would send the suggestion to the backend
  }

  // If user is not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to='/sign-in-2' />
  }

  return (
    <>
      <div className='py-6'>
        <h1 className='text-foreground mb-0 flex gap-2 text-3xl font-bold'>
          Welcome to
          <AppName
            className='text-primary text-3xl'
            className2='text-3xl text-primary'
          />
        </h1>

        <div className='bg-card shadow-social dark:shadow-social-dark hover:shadow-social-hover dark:hover:shadow-social-dark-hover mb-8 rounded-lg p-6 transition-all'>
          <h2 className='text-foreground mb-4 text-2xl font-bold'>
            Explore Content
          </h2>
          <ExploreSection />
        </div>

        <div className='bg-card shadow-social dark:shadow-social-dark hover:shadow-social-hover dark:hover:shadow-social-dark-hover overflow-hidden rounded-lg transition-all'>
          <SuggestorsList
            suggestors={suggestors}
            onSuggestorClick={handleSuggestorClick}
            className='p-6'
          />
        </div>

        <div className='bg-card shadow-social dark:shadow-social-dark hover:shadow-social-hover dark:hover:shadow-social-dark-hover mt-8 rounded-lg p-6 transition-all'>
          <h2 className='text-foreground mb-4 text-2xl font-bold'>
            Recent Suggestions
          </h2>
          {recentSuggestions.length > 0 ? (
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {recentSuggestions.map((item) => (
                <div
                  key={item.id}
                  className='bg-background border-border overflow-hidden rounded-lg border shadow-sm'
                >
                  {item.imageUrl && (
                    <div
                      className='bg-muted h-40 w-full'
                      onClick={() =>
                        navigate({
                          to: "/content/$id",
                          params: { id: item.id },
                        })
                      }
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className='h-full w-full object-cover'
                      />
                    </div>
                  )}
                  <div className='p-4'>
                    <div className='mb-2 flex items-center justify-between'>
                      <span className='text-primary text-xs font-medium capitalize'>
                        {item.type}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {new Date(item.suggestedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3
                      className='text-foreground mb-1 line-clamp-1 text-lg font-semibold'
                      onClick={() => navigate({ to: `/content/${item.id}` })}
                    >
                      {item.title}
                    </h3>
                    <p className='text-muted-foreground mb-2 text-sm'>
                      {item.creator} • {item.year}
                    </p>

                    {/* Status indicator */}
                    {item.status && (
                      <div className='mb-3'>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            item.status === 'watched'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : item.status === 'watching'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}
                        >
                          {item.status === 'watched' ? (
                            <>
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='12'
                                height='12'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                className='mr-1'
                              >
                                <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path>
                                <polyline points='22 4 12 14.01 9 11.01'></polyline>
                              </svg>
                              Watched
                            </>
                          ) : item.status === 'watching' ? (
                            <>
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='12'
                                height='12'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                className='mr-1'
                              >
                                <circle cx='12' cy='12' r='10'></circle>
                                <polyline points='12 6 12 12 16 14'></polyline>
                              </svg>
                              Currently Watching
                            </>
                          ) : (
                            <>
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='12'
                                height='12'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                className='mr-1'
                              >
                                <path d='M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'></path>
                              </svg>
                              In Watchlist
                            </>
                          )}
                        </span>
                      </div>
                    )}

                    <div className='border-border flex items-center border-t pt-3'>
                      <span className='text-foreground mr-2 text-xs font-medium'>
                        Suggested by:
                      </span>
                      <div className='flex items-center'>
                        {item.suggestedBy?.avatar && (
                          <div className='ring-primary/20 mr-1 h-5 w-5 overflow-hidden rounded-full ring-1'>
                            <img
                              src={item.suggestedBy.avatar}
                              alt={item.suggestedBy.name}
                              className='h-full w-full object-cover'
                            />
                          </div>
                        )}
                        <span className='text-foreground text-xs font-medium'>
                          {item.suggestedBy?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-muted-foreground bg-accent/30 rounded-lg p-8 text-center'>
              <p>Your recent suggestions will appear here.</p>
              <p className='mt-2'>
                Use the{' '}
                <span className='text-primary font-medium'>Suggest</span> button
                to start recommending content to your friends!
              </p>
            </div>
          )}
        </div>
      </div>

      <SuggestionButton
        onClick={() => setIsSuggestionFlowOpen(true)}
        label='Suggest'
        tooltipText='Suggest content to your friends'
      />

      <SuggestionFlow
        open={isSuggestionFlowOpen}
        onOpenChange={setIsSuggestionFlowOpen}
        onComplete={handleSuggestionComplete}
      />
    </>
  )
}

export default Home

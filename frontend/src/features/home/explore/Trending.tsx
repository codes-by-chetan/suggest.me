import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/layout/Navbar'

interface ContentItem {
  id: string
  title: string
  type: string
  imageUrl?: string
  year?: string
  creator?: string
  description?: string
  suggestedBy?: {
    id: string
    name: string
    avatar?: string
  }
  suggestedAt: string
  status?: 'watched' | 'watching' | 'watchlist' | null
  whereToWatch?: string[]
  whereToRead?: string[]
  whereToListen?: string[]
}

const Trending = () => {
  const router = useRouter()
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([])

  // Mock function to fetch trending content
  useEffect(() => {
    // In a real app, this would be an API call
    const mockTrending: ContentItem[] = [
      {
        id: 't1',
        title: 'Dune: Part Two',
        type: 'movie',
        imageUrl:
          'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=300&q=80',
        year: '2024',
        creator: 'Denis Villeneuve',
        description:
          'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        suggestedAt: new Date().toISOString(),
        whereToWatch: ['HBO Max', 'Theaters'],
      },
      {
        id: 't2',
        title: 'The Three-Body Problem',
        type: 'book',
        imageUrl:
          'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80',
        year: '2008',
        creator: 'Liu Cixin',
        description:
          "Set against the backdrop of China's Cultural Revolution, a secret military project sends signals into space to establish contact with aliens.",
        suggestedAt: new Date().toISOString(),
        whereToRead: ['Amazon', 'Barnes & Noble', 'Local Bookstore'],
      },
      {
        id: 't3',
        title: 'Oppenheimer',
        type: 'movie',
        imageUrl:
          'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=300&q=80',
        year: '2023',
        creator: 'Christopher Nolan',
        description:
          'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
        suggestedAt: new Date().toISOString(),
        whereToWatch: ['Apple TV+', 'Amazon Prime'],
      },
      {
        id: 't4',
        title: 'Demon Slayer',
        type: 'anime',
        imageUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80',
        year: '2019',
        creator: 'Koyoharu Gotouge',
        description:
          'A young man named Tanjiro joins the Demon Slayer Corps to find a cure for his sister, who has been turned into a demon.',
        suggestedAt: new Date().toISOString(),
        whereToWatch: ['Crunchyroll', 'Netflix'],
      },
    ]

    setTrendingContent(mockTrending)
  }, [])

  const renderContentCard = (item: ContentItem) => (
    <div
      key={item.id}
      className='bg-background border-border cursor-pointer overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md'
      onClick={() => router.navigate({ to: `/content/${item.id}` })}
    >
      {item.imageUrl && (
        <div className='bg-muted h-40 w-full'>
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
        <h3 className='text-foreground mb-1 line-clamp-1 text-lg font-semibold'>
          {item.title}
        </h3>
        <p className='text-muted-foreground mb-2 text-sm'>
          {item.creator} • {item.year}
        </p>

        {item.suggestedBy && (
          <div className='border-border flex items-center border-t pt-3'>
            <span className='text-foreground mr-2 text-xs font-medium'>
              {item.status === 'watching'
                ? 'Currently watching:'
                : 'Suggested by:'}
            </span>
            <div className='flex items-center'>
              {item.suggestedBy.avatar && (
                <div className='ring-primary/20 mr-1 h-5 w-5 overflow-hidden rounded-full ring-1'>
                  <img
                    src={item.suggestedBy.avatar}
                    alt={item.suggestedBy.name}
                    className='h-full w-full object-cover'
                  />
                </div>
              )}
              <span className='text-foreground text-xs font-medium'>
                {item.suggestedBy.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className='bg-background min-h-screen'>
      <Navbar />

      <main className='mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8'>
        <div className='py-6'>
          <Button
            variant='ghost'
            className='mb-4'
            onClick={() => router.history.back()}
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>

          <h1 className='text-foreground mb-8 text-3xl font-bold'>
            Trending Now
          </h1>

          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
            {trendingContent.map(renderContentCard)}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Trending

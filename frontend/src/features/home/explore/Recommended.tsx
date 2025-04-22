import { useRouter } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ContentItem {
  id: string
  title: string
  type: 'movie' | 'book' | 'anime' | 'song' | 'video'
  imageUrl: string
  creator?: string
  releaseYear?: number
  whereToWatch?: string[]
  whereToRead?: string[]
  whereToListen?: string[]
  matchPercentage?: number
}

const Recommended = () => {
  const router = useRouter()

  const recommendedContent: ContentItem[] = [
    {
      id: '1',
      title: 'The Matrix',
      type: 'movie',
      imageUrl:
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
      creator: 'The Wachowskis',
      releaseYear: 1999,
      whereToWatch: ['Netflix', 'HBO Max'],
      matchPercentage: 95,
    },
    {
      id: '2',
      title: 'Dune',
      type: 'book',
      imageUrl:
        'https://images.unsplash.com/photo-1531072901881-d644216d4bf9?w=800&q=80',
      creator: 'Frank Herbert',
      releaseYear: 1965,
      whereToRead: ['Amazon Kindle', 'Barnes & Noble'],
      matchPercentage: 92,
    },
    {
      id: '3',
      title: 'Death Note',
      type: 'anime',
      imageUrl:
        'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800&q=80',
      creator: 'Tsugumi Ohba',
      releaseYear: 2006,
      whereToWatch: ['Netflix', 'Crunchyroll'],
      matchPercentage: 88,
    },
    {
      id: '4',
      title: 'Blinding Lights',
      type: 'song',
      imageUrl:
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
      creator: 'The Weeknd',
      releaseYear: 2019,
      whereToListen: ['Spotify', 'Apple Music'],
      matchPercentage: 85,
    },
  ]

  const handleCardClick = (id: string) => {
    router.navigate({ to: `/content/${id}` })
  }

  return (
    <div className='container mx-auto py-8'>
      <h1 className='mb-6 text-3xl font-bold'>Recommended For You</h1>
      <p className='mb-8 text-gray-600'>
        Content we think you'll enjoy based on your preferences and history.
      </p>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {recommendedContent.map((item) => (
          <Card
            key={item.id}
            className='cursor-pointer transition-shadow hover:shadow-lg'
            onClick={() => handleCardClick(item.id)}
          >
            <CardHeader className='p-0'>
              <div className='h-48 w-full overflow-hidden rounded-t-lg'>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className='h-full w-full object-cover'
                />
              </div>
            </CardHeader>
            <CardContent className='pt-4'>
              <div className='flex items-start justify-between'>
                <CardTitle className='text-xl'>{item.title}</CardTitle>
                {item.matchPercentage && (
                  <span className='rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'>
                    {item.matchPercentage}% match
                  </span>
                )}
              </div>
              <div className='mt-2 text-sm text-gray-600'>
                <p>
                  {item.creator} • {item.releaseYear}
                </p>
                <p className='mt-1 capitalize'>{item.type}</p>
              </div>
            </CardContent>
            <CardFooter className='border-t pt-4 text-sm text-gray-500'>
              <p>
                Available on:{' '}
                {item.whereToWatch?.join(', ') ||
                  item.whereToRead?.join(', ') ||
                  item.whereToListen?.join(', ')}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Recommended

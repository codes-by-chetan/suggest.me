import React from 'react';
import {
  Film,
  BookOpen,
  Music,
  Clapperboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface ContentType {
  id: | 'movie'
    | 'music'
    | 'book'
    | 'series'
    | 'people'
    | 'video'
    | 'album'
    | 'songs'
    |'';
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface ContentTypeSelectorProps {
  onSelect?: (
    contentType:
      | 'movie'
      | 'music'
      | 'book'
      | 'series'
      | 'people'
      | 'video'
      | 'album'
      | 'songs'
      | ''
  ) => void;
  selectedType?: string;
}

const ContentTypeSelector = ({
  onSelect = () => {},
  selectedType = '',
}: ContentTypeSelectorProps) => {
  const contentTypes: ContentType[] = [
    {
      id: 'movie',
      name: 'Movies',
      icon: <Film className='h-8 w-8' />,
      description: 'Suggest a film to watch',
    },
    {
      id: 'series',
      name: 'Series',
      icon: <Clapperboard className='h-8 w-8' />,
      description: 'Suggest a film to watch',
    },
    {
      id: 'book',
      name: 'Books',
      icon: <BookOpen className='h-8 w-8' />,
      description: 'Recommend a good read',
    },
    // {
    //   id: "anime",
    //   name: "Anime",
    //   icon: <Tv className="h-8 w-8" />,
    //   description: "Share an anime series",
    // },
    {
      id: 'music',
      name: 'Music',
      icon: <Music className='h-8 w-8' />,
      description: 'Suggest a track to listen to',
    },
    // {
    //   id: 'youtube',
    //   name: 'YouTube',
    //   icon: <Youtube className='h-8 w-8' />,
    //   description: 'Share a YouTube video',
    // },
    // {
    //   id: 'reels',
    //   name: 'Reels',
    //   icon: <Instagram className='h-8 w-8' />,
    //   description: 'Suggest a short video',
    // },
  ];

  return (
    <div className='dark:bg-muted w-full rounded-lg bg-white p-4'>
      <h2 className='mb-4 text-center text-2xl font-bold'>
        What would you like to suggest?
      </h2>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
        {contentTypes.map((type) => (
          <Card
            key={type.id}
            className={cn(
              'cursor-pointer border-2 transition-all hover:scale-105',
              selectedType === type.id
                ? 'border-primary bg-primary/10'
                : 'border-gray-600'
            )}
            onClick={() => onSelect(type.id)}
          >
            <CardContent className='flex flex-col items-center justify-center p-6 text-center'>
              <div className='bg-primary/10 mb-2 rounded-full p-2'>
                {type.icon}
              </div>
              <h3 className='text-lg font-semibold'>{type.name}</h3>
              <p className='mt-1 text-sm text-gray-500'>{type.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContentTypeSelector;

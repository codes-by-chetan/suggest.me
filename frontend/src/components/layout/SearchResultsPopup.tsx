/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from '@tanstack/react-router';
import {
  GlobalSearchResults,
  PeopleSearchResult,
} from '@/interfaces/api/search.interface';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, BookOpen, Tv, Music, Users, Video } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import VerifiedBadgeIcon from '../profile/VerifiedBadgeIcon';
import { Button } from '../ui/button';

interface SearchResult {
  _id: string;
  title?: string;
  name?: string;
  slug?: string;
  poster?: { url: string; [key: string]: any } | string;
  coverImage?: string;
  profileImage?: string;
  userName?: string;
  fullName?: { firstName: string; lastName: string };
  email?: string;
  profile?: {
    avatar?: { url: string };
    bio?: string;
    [key: string]: any;
  } | null;
  [key: string]: any;
}

interface _SearchResults {
  [key: string]: {
    data: SearchResult[];
    total: number;
  };
}

interface _SearchResponse {
  results?: SearchResult[];
  pagination?: {
    page: number;
    limit: number;
    totalResults: number;
    totalPages: number;
  };
  data?: SearchResult[];
}

interface SearchResultsPopupProps {
  globalResults: GlobalSearchResults | null;
  peopleResults: PeopleSearchResult | null;
  isSearching: boolean;
  searchTerm: string;
}

const SearchResultsPopup = ({
  globalResults,
  peopleResults,
  isSearching,
  searchTerm,
}: SearchResultsPopupProps) => {
  const navigate = useNavigate();
  const getIconForType = (type: string) => {
    switch (type) {
      case 'movies':
        return <Film className='h-4 w-4' />;
      case 'series':
        return <Tv className='h-4 w-4' />;
      case 'books':
        return <BookOpen className='h-4 w-4' />;
      case 'music':
      case 'albums':
        return <Music className='h-4 w-4' />;
      case 'videos':
        return <Video className='h-4 w-4' />;
      case 'people':
      case 'users':
        return <Users className='h-4 w-4' />;
      default:
        return null;
    }
  };

  const getRouteForType = (type: string, item: SearchResult) => {
    const slug =
      item._id ||
      item?.imdbId ||
      item?.tmdbId ||
      item?.spotifyId ||
      item?.openLibraryId ||
      item?.googleBooksId;
    switch (type) {
      case 'movie':
        return `/movies/${slug}`;
      case 'series':
        return `/series/${slug}`;
      case 'book':
        return `/books/${slug}`;
      case 'music':
      case 'albums':
        return `/music/${slug}`;
      case 'video':
        return `/videos/${slug}`;
      case 'people':
        return `/people/${slug}`;
      case 'users':
        return `/profile/${item._id}`;
      default:
        return '#';
    }
  };

  const renderResultItem = (item: SearchResult, type: string) => {
    const image =
      typeof item.poster === 'object'
        ? item.poster?.url
        : item.poster ||
          item.coverImage ||
          item.profileImage ||
          item.profile?.avatar?.url;
    const title =
      item.title ||
      item.name ||
      item.userName ||
      (item.fullName
        ? `${item.fullName.firstName} ${item.fullName.lastName}`
        : 'Unknown');

    return (
      <motion.div
        key={item._id}
        className='hover:bg-accent/50 flex cursor-pointer items-center gap-3 p-2 transition-colors'
        onClick={() => {
          navigate({ to: getRouteForType(type, item) });
          console.log('type: ', type, item);

          console.log(getRouteForType(type, item));

          document.dispatchEvent(new Event('closeSearchPopups'));
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        {image ? (
          <img
            src={image}
            alt={title}
            className='h-8 w-8 rounded object-cover'
          />
        ) : (
          <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
            {getIconForType(type)}
          </div>
        )}
        <div className='min-w-0 flex-1'>
          <div className='flex items-center'>
            <p className='line-clamp-1 text-sm font-medium'>{title}</p>
            {item.profile?.isVerified && (
              <VerifiedBadgeIcon className={'h-3 w-3'} />
            )}
          </div>
          <p className='text-muted-foreground text-xs capitalize'>{type}</p>
        </div>
      </motion.div>
    );
  };

  // Animation variants for the popup container
  const popupVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  // Animation variants for staggered items
  const containerVariants = {
    hidden: { transition: { staggerChildren: 0.05 } },
    visible: { transition: { staggerChildren: 0.05 } },
  };
  console.log('globalResults: ', globalResults);
  console.log('peopleResults: ', peopleResults);
  return (
    <motion.div
      className='bg-card border-border w-80 rounded-md border p-0 shadow-lg'
      variants={popupVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className='p-3'>
        <h3 className='text-sm font-medium'>Search Results</h3>
      </div>
      <Separator />
      <ScrollArea className='h-[300px]'>
        <AnimatePresence mode='wait'>
          {isSearching ? (
            <motion.div
              key='searching'
              className='text-muted-foreground p-4 text-center text-sm'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              Searching...
            </motion.div>
          ) : globalResults && Object.keys(globalResults).length > 0 ? (
            <>
              {peopleResults?.results && peopleResults?.results.length > 0 && (
                <motion.div
                  key='people-results'
                  variants={containerVariants}
                  initial='hidden'
                  animate='visible'
                  exit='hidden'
                >
                  <div className='text-muted-foreground flex items-center gap-2 px-3 py-2 text-xs font-semibold capitalize'>
                    <Users className='h-4 w-4' />
                    Users
                  </div>
                  {peopleResults.results.map((item: any) =>
                    renderResultItem(item, 'users')
                  )}
                </motion.div>
              )}
              <motion.div
                key='global-results'
                variants={containerVariants}
                initial='hidden'
                animate='visible'
                exit='hidden'
              >
                {Object.entries(globalResults).map(([type, { data }]) =>
                  data.length > 0 ? (
                    <div key={type}>
                      <div className='text-muted-foreground flex items-center gap-2 px-3 py-2 text-xs font-semibold capitalize'>
                        {getIconForType(type)}
                        {type}
                      </div>
                      {data.map((item: any) => renderResultItem(item, type))}
                    </div>
                  ) : null
                )}
              </motion.div>
            </>
          ) : peopleResults?.results && peopleResults.results.length > 0 ? (
            <motion.div
              key='people-results'
              variants={containerVariants}
              initial='hidden'
              animate='visible'
              exit='hidden'
            >
              <div className='text-muted-foreground flex items-center gap-2 px-3 py-2 text-xs font-semibold capitalize'>
                <Users className='h-4 w-4' />
                Users
              </div>
              {peopleResults.results.map((item: any) =>
                renderResultItem(item, 'users')
              )}
            </motion.div>
          ) : (
            <motion.div
              key='no-results'
              className='text-muted-foreground p-4 text-center text-sm'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              No results found
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
      <Separator />
      <div className='p-3'>
        <Button
          variant='default'
          size='sm'
          className='w-full text-xs'
          onClick={() => {
            navigate({ to: `/search?q=${searchTerm}` });
            document.dispatchEvent(new Event('closeSearchPopups'));
          }}
        >
          View All Results
        </Button>
      </div>
    </motion.div>
  );
};

export default SearchResultsPopup;

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { globalSearch } from '@/services/search.service';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '../ui/scroll-area';

interface ContentSearchProps {
  contentType?:
    | 'movie'
    | 'music'
    | 'book'
    | 'series'
    | 'people'
    | 'video'
    | 'album'
    | 'songs'
    | '';
  onSelect?: (content: ContentItem) => void;
}

interface ContentItem {
  id: string;
  title: string;
  type:
    | 'movie'
    | 'music'
    | 'book'
    | 'series'
    | 'people'
    | 'video'
    | 'album'
    | 'songs'
    | '';
  imageUrl?: string;
  year?: string;
  creator?: string;
  description?: string;
}

const ContentSearch = ({
  contentType = 'movie',
  onSelect = () => {},
}: ContentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [_isSearching, setIsSearching] = useState(false);
  const [_desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [_mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [_searchData, _setSearchData] = useState(null);
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  // Mock data for different content types
  const mockData: Record<string, ContentItem[]> = {
    movie: [
      {
        id: 'm1',
        title: 'The Shawshank Redemption',
        type: 'movie',
        imageUrl:
          'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300&q=80',
        year: '1994',
        creator: 'Frank Darabont',
        description:
          'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
      },
      {
        id: 'm2',
        title: 'The Godfather',
        type: 'movie',
        imageUrl:
          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&q=80',
        year: '1972',
        creator: 'Francis Ford Coppola',
        description:
          'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
      },
      {
        id: 'm3',
        title: 'The Dark Knight',
        type: 'movie',
        imageUrl:
          'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=300&q=80',
        year: '2008',
        creator: 'Christopher Nolan',
        description:
          'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      },
    ],
    book: [
      {
        id: 'b1',
        title: 'To Kill a Mockingbird',
        type: 'book',
        imageUrl:
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80',
        year: '1960',
        creator: 'Harper Lee',
        description:
          'The story of racial injustice and the loss of innocence in the American South during the Great Depression.',
      },
      {
        id: 'b2',
        title: '1984',
        type: 'book',
        imageUrl:
          'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80',
        year: '1949',
        creator: 'George Orwell',
        description:
          'A dystopian social science fiction novel and cautionary tale set in a totalitarian state.',
      },
    ],
    anime: [
      {
        id: 'a1',
        title: 'Attack on Titan',
        type: 'series',
        imageUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80',
        year: '2013',
        creator: 'Hajime Isayama',
        description:
          'In a world where humanity lives within cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason.',
      },
      {
        id: 'a2',
        title: 'Death Note',
        type: 'series',
        imageUrl:
          'https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=300&q=80',
        year: '2006',
        creator: 'Tsugumi Ohba',
        description:
          "A high school student discovers a supernatural notebook that allows him to kill anyone by writing the victim's name while picturing their face.",
      },
    ],
    song: [
      {
        id: 's1',
        title: 'Bohemian Rhapsody',
        type: 'music',
        imageUrl:
          'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80',
        year: '1975',
        creator: 'Queen',
        description:
          'A six-minute suite, consisting of several sections without a chorus: an intro, a ballad segment, an operatic passage, a hard rock part and a reflective coda.',
      },
      {
        id: 's2',
        title: 'Imagine',
        type: 'music',
        imageUrl:
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&q=80',
        year: '1971',
        creator: 'John Lennon',
        description:
          'A song co-produced by John Lennon, Yoko Ono, and Phil Spector, encouraging listeners to imagine a world of peace.',
      },
    ],
  };

  useEffect(() => {
    if (debouncedSearchTerm.length < 1) {
      return;
    }
    // Simulate API call with mock data
    setIsLoading(true);

    // Simulate network delay
    const timer = setTimeout(() => {
      const filteredResults =
        mockData[contentType]?.filter((item) => {
          console.log('searchquery: ', debouncedSearchTerm);

          // console.log(item.title.toLowerCase(), searchQuery.toLowerCase(), "includes =>", item.title.toLowerCase().includes(searchQuery.toLowerCase()))
          return item.title
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase());
        }) || [];
      console.log(filteredResults, contentType);
      performSearch(debouncedSearchTerm);
      if (!searchResults || searchResults.length < 1) {
        setSearchResults(filteredResults);
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [debouncedSearchTerm, contentType, mockData, searchResults]);

  const performSearch = async (term: string) => {
    if (term.trim().length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    globalSearch({ searchTerm: term, searchType: contentType }).then(
      (response) => {
        if (response.data?.results && contentType !== '') {
          console.log('search res: ', response.data.results[contentType].data);
          const normalizedResults = response.data.results[contentType].data.map(
            (item: any) => ({
              id:
                item._id ||
                item?.imdbId ||
                item?.tmdbId ||
                item?.spotifyId ||
                item?.openLibraryId ||
                item?.googleBooksId,
              title: item.title,
              type: contentType,
              imageUrl: item.poster?.url || item.poster || '',
              year: item.year || '',
              creator: item.director?.join(', ') || '',
              description: item.plot || '',
            })
          );
          setSearchResults(normalizedResults);
        }
      }
    );
    // Simulate a search API call

    try {
      setIsSearching(true);
      // Define setDesktopSearchOpen if needed
      setDesktopSearchOpen(true); // Open popup for desktop
      setMobileSearchOpen(true); // Open popup for mobile
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSelectContent = (content: ContentItem) => {
    onSelect(content);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Add a function to check if any content is selected
  const _isContentSelected = (_content: ContentItem) => {
    return false; // This will be replaced by your actual selection logic
  };

  return (
    <div className='dark:bg-muted w-full rounded-lg bg-white p-3 shadow-sm'>
      <h2 className='mb-4 text-xl font-semibold'>Search for {contentType}</h2>

      <div className='relative'>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
          <Input
            placeholder={`Search for ${contentType}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pr-10 pl-10'
          />
          {searchQuery && (
            <Button
              variant='ghost'
              size='icon'
              className='absolute top-1 right-1 h-7 w-7'
              onClick={handleClearSearch}
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>

        {isLoading && (
          <div className='text-muted-foreground mt-2 text-sm'>Searching...</div>
        )}

        {searchResults?.length > 0 && (
          <ScrollArea>
            <div className='mt-2 max-h-[300px] rounded-md border'>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className='flex cursor-pointer items-start border-b p-3 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700'
                  onClick={() => handleSelectContent(result)}
                >
                  {result.imageUrl && (
                    <div className='mr-3 flex-shrink-0'>
                      <img
                        src={result.imageUrl || '/placeholder.svg'}
                        alt={result.title}
                        className='h-16 w-12 rounded object-cover'
                      />
                    </div>
                  )}
                  <div>
                    <h3 className='font-medium'>{result.title}</h3>
                    <p className='text-muted-foreground text-sm'>
                      {result.creator} • {result.year}
                    </p>
                    <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                      {result.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {searchQuery?.length > 2 &&
          searchResults?.length === 0 &&
          !isLoading && (
            <div className='text-muted-foreground mt-2 flex flex-col items-center rounded-md border p-3 text-sm'>
              <p className='mb-2 text-center'>
                No {contentType}s found matching "{searchQuery}".
              </p>
              <Button
                variant='default'
                className='mt-2 w-full'
                onClick={() =>
                  (window.location.href = `/add-content/${contentType}?title=${encodeURIComponent(searchQuery)}`)
                }
              >
                Add new {contentType}
              </Button>
            </div>
          )}
      </div>

      <div className='text-muted-foreground mt-4 text-sm'>
        <p>
          Search for existing {contentType}s or{' '}
          <a
            href={`/add-content/${contentType}`}
            className='text-primary font-medium hover:underline'
          >
            add a new one
          </a>{' '}
          if not found.
        </p>
      </div>
    </div>
  );
};

export default ContentSearch;

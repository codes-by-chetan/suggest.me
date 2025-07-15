import { useNavigate } from '@tanstack/react-router';
import type { SearchResultItem } from '@/interfaces/search.interface';
import { Music, Book, Film, Tv, Library } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VerifiedBadgeIcon from '@/components/profile/VerifiedBadgeIcon';

interface SearchResultItemProps {
  item: SearchResultItem;
  _index: number;
  activeTab: string;
  imageFailed: boolean;
  getPosterUrl: (item: SearchResultItem) => string;
  onImageError: () => void;
}

export function SearchResultItemComponent({
  item,
  _index,
  activeTab,
  imageFailed,
  getPosterUrl,
  onImageError,
}: SearchResultItemProps) {
  const navigate = useNavigate();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'music':
      case 'songs':
        return <Music className='text-muted-foreground h-12 w-8' />;
      case 'book':
        return <Book className='text-muted-foreground h-12 w-8' />;
      case 'movie':
        return <Film className='text-muted-foreground h-12 w-8' />;
      case 'series':
        return <Tv className='text-muted-foreground h-12 w-8' />;
      default:
        return <Library className='text-muted-foreground h-12 w-8' />;
    }
  };

  const clipPlot = (plot: string | undefined) => {
    if (!plot) return '';
    return plot.length > 40 ? `${plot.slice(0, 40)}...` : plot;
  };

  const handleItemClick = () => {
    if (activeTab === 'users') {
      // Navigate to user profile
      navigate({ to: `/profile/${item._id}` });
    } else {
      // Navigate to content detail page based on category
      const category = item.category || activeTab;
      let route = '';

      switch (category) {
        case 'movie':
          route = `/movies/${item.imdbId || item._id || item.tmdbId}`;
          break;
        case 'series':
          route = `/series/${item.imdbId || item._id || item.tmdbId}`;
          break;
        case 'book':
          route = `/books/${item.googleBooksId || item._id}`;
          break;
        case 'music':
          route = `/music/${item.spotifyId || item._id}`;
          break;
        default:
          // For "all" tab or unknown categories, try to determine from available IDs
          if (item.tmdbId) {
            route = `/movies/${item.imdbId}`;
          } else if (item.googleBooksId) {
            route = `/books/${item.googleBooksId}`;
          } else if (item.spotifyId) {
            route = `/music/${item.spotifyId}`;
          } else {
            route = `/content/${item._id}`;
          }
      }

      navigate({ to: route });
    }
  };

  const getDisplayName = () => {
    if (activeTab === 'users') {
      if (item.fullName) {
        return `${item.fullName.firstName} ${item.fullName.lastName}`.trim();
      }
      return item.profile?.displayName || 'Unknown User';
    }
    return item.title || item.name || 'Unknown';
  };

  const getAvatarUrl = () => {
    if (activeTab === 'users') {
      return item.profile?.avatar?.url || item.profileImage?.url || '';
    }
    return '';
  };

  return (
    <div
      className='hover:bg-accent/50 box-border flex min-h-16 w-full cursor-pointer items-start gap-2 overflow-hidden rounded-md p-2 transition-colors'
      role='listitem'
      onClick={handleItemClick}
    >
      {activeTab === 'users' ? (
        <>
          <Avatar className='h-12 w-12 flex-shrink-0'>
            {getAvatarUrl() ? (
              <AvatarImage
                src={getAvatarUrl() || '/placeholder.svg'}
                alt={getDisplayName()}
              />
            ) : (
              <AvatarFallback>
                {getDisplayName().charAt(0) || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className='min-w-0 flex-1 overflow-hidden'>
            <div className='flex items-center gap-1'>
              <p className='line-clamp-2 text-sm font-semibold break-words'>
                {getDisplayName()}
              </p>
              {item?.profile.isVerified && (
                <VerifiedBadgeIcon className='h-4 w-4 sm:h-5 sm:w-5' />
              )}
            </div>
            {item.profile?.bio && (
              <p className='text-muted-foreground truncate text-xs break-words'>
                {clipPlot(item.profile.bio)}
              </p>
            )}
            {item.profile?.displayName && (
              <p className='text-muted-foreground truncate text-xs break-words'>
                {clipPlot(item.profile.displayName)}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          {imageFailed || !getPosterUrl(item) ? (
            <div className='flex h-12 w-8 flex-shrink-0 items-center justify-center'>
              {getCategoryIcon(item.category || activeTab)}
            </div>
          ) : (
            <img
              src={getPosterUrl(item) || '/placeholder.svg'}
              alt={getDisplayName()}
              className='h-12 w-8 flex-shrink-0 rounded object-cover'
              onError={onImageError}
            />
          )}
          <div className='min-w-0 flex-1 overflow-hidden'>
            <p className='line-clamp-2 text-sm font-semibold break-words'>
              {getDisplayName()}
            </p>
            <p className='text-muted-foreground truncate text-xs break-words'>
              {item.category || activeTab} {item.year ? `(${item.year})` : ''}
            </p>
            <p className='text-muted-foreground max-w-full truncate text-xs break-words'>
              {clipPlot(item.plot)}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

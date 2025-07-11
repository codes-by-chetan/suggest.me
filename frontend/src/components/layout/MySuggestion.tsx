import { useNavigate } from '@tanstack/react-router';
import type { ContentItem } from '@/interfaces/content.interfaces';
import { toast } from '@/services/toast.service';
import { motion } from 'framer-motion';
import {
  Film,
  BookOpen,
  Tv,
  Music,
  Youtube,
  Instagram,
  Clapperboard,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusDropdown } from '../reusables/status-dropdown';

interface MySuggestionCardProps {
  item: ContentItem;
}

function MySuggestionCard({ item }: MySuggestionCardProps) {
  const navigate = useNavigate();

  const getIconForType = (type: string) => {
    switch (type) {
      case 'movie':
        return <Film className='h-3 w-3 min-[470px]:h-4 min-[470px]:w-4' />;
      case 'series':
        return (
          <Clapperboard className='h-3 w-3 min-[470px]:h-4 min-[470px]:w-4' />
        );
      case 'book':
        return <BookOpen className='h-3 w-3 min-[470px]:h-4 min-[470px]:w-4' />;
      case 'anime':
        return <Tv className='h-3 w-3 min-[470px]:h-4 min-[470px]:w-4' />;
      case 'music':
      case 'song':
        return <Music className='h-3 w-3 min-[470px]:h-4 min-[470px]:w-4' />;
      case 'youtube':
        return <Youtube className='h-3 w-3 min-[470px]:h-4 min-[470px]:w-4' />;
      case 'reels':
        return (
          <Instagram className='h-3 w-3 min-[470px]:h-4 min-[470px]:w-4' />
        );
      default:
        return <Film className='h-3 w-3 min-[470px]:h-4 min-[470px]:w-4' />;
    }
  };

  const getRouteForType = (type: string, id: string) => {
    switch (type) {
      case 'movie':
        return `/movies/${id}`;
      case 'series':
        return `/series/${id}`;
      case 'book':
        return `/books/${id}`;
      case 'music':
      case 'albums':
        return `/music/${id}`;
      case 'video':
        return `/videos/${id}`;
      case 'people':
        return `/people/${id}`;
      case 'users':
        return `/profile/${id}`;
      default:
        return '#';
    }
  };

  // Mock status change handler since this is for suggestions made by user
  const handleStatusChange = async (_status: string) => {
    toast.info('This is a suggestion you made to others');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className='h-full w-full'
    >
      <Card className='border-border/50 bg-card relative flex h-full max-w-[calc(100vw-35px)] flex-col overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-md'>
        <CardContent className='flex h-full flex-col p-1.5 min-[470px]:p-3 sm:p-4'>
          {/* Status indicator (read-only for suggestions made by user) */}
          {item.status && (
            <div className='absolute top-1 right-1 z-10 min-[470px]:top-2 min-[470px]:right-2'>
              <StatusDropdown
                currentStatus={item.status}
                contentType={item.type}
                onStatusChange={handleStatusChange}
                loading={{}}
                size='sm'
              />
            </div>
          )}

          {/* Ultra-compact layout for < 470px, horizontal layout for >= 470px */}
          <div className='mb-1 flex gap-2 min-[470px]:mb-2 min-[470px]:gap-3'>
            {/* Image */}
            <div
              className={cn(
                'bg-muted relative flex-shrink-0 cursor-pointer overflow-hidden rounded-lg',
                item.type === 'music' || item.type === 'song'
                  ? 'h-10 w-10 min-[470px]:h-16 min-[470px]:w-16 sm:h-20 sm:w-20'
                  : 'h-12 w-10 min-[470px]:h-24 min-[470px]:w-16 sm:h-30 sm:w-20'
              )}
              onClick={() =>
                navigate({
                  to: getRouteForType(item.type, item.contentId || item.id),
                })
              }
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl || '/placeholder.svg'}
                  alt={item.title}
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='bg-primary/10 flex h-full w-full items-center justify-center'>
                  {getIconForType(item.type)}
                </div>
              )}
            </div>

            {/* Content metadata */}
            <div className='flex min-w-0 flex-1 flex-col justify-between pr-4 min-[470px]:pr-6'>
              <div>
                <div className='mb-0.5 flex flex-wrap items-center gap-1 min-[470px]:mb-1 min-[470px]:gap-2'>
                  <div className='bg-primary/10 dark:bg-primary/20 rounded-full p-0.5 min-[470px]:p-1'>
                    {getIconForType(item.type)}
                  </div>
                  <span className='text-primary text-xs font-medium capitalize'>
                    {item.type}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {item.year || 'N/A'}
                  </span>
                </div>
                <div className='text-muted-foreground mb-0.5 text-xs min-[470px]:mb-1'>
                  {new Date(
                    item.suggestedAt || item.addedAt || Date.now()
                  ).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Title and creator */}
          <div className='mb-1 min-[470px]:mb-2'>
            <h3
              className='text-foreground mb-0.5 line-clamp-2 cursor-pointer text-xs font-semibold break-words min-[470px]:mb-1 min-[470px]:text-sm sm:text-base'
              onClick={() =>
                navigate({
                  to: getRouteForType(item.type, item.contentId || item.id),
                })
              }
            >
              {item.title}
            </h3>
            <p className='text-muted-foreground line-clamp-1 text-xs break-words'>
              {item.creator || item?.artist || 'Unknown'}
            </p>
          </div>

          {/* Description - Fixed height container */}
          <div className='mb-1 h-[24px] overflow-hidden min-[470px]:mb-2 min-[470px]:h-[48px]'>
            <p
              className='text-foreground line-clamp-2 text-xs break-words min-[470px]:line-clamp-3'
              dangerouslySetInnerHTML={{
                __html: item.description || 'No description available.',
              }}
            />
          </div>

          {/* Spacer to push footer to bottom */}
          <div className='flex-grow'></div>

          {/* Suggested to */}
          <div className='border-border flex items-center justify-between border-t pt-1 min-[470px]:pt-2'>
            <div className='flex min-w-0 flex-1 items-center'>
              <span className='text-foreground mr-1 flex-shrink-0 text-xs font-medium'>
                To:
              </span>
              <div className='flex min-w-0 flex-wrap items-center gap-0.5 min-[470px]:gap-1'>
                {item.suggestedTo && item.suggestedTo.length > 0 ? (
                  <>
                    {item.suggestedTo.slice(0, 2).map((recipient, _index) => (
                      <Avatar
                        key={recipient.id}
                        className='ring-primary/20 h-2.5 w-2.5 flex-shrink-0 ring-1 min-[470px]:h-4 min-[470px]:w-4'
                      >
                        <AvatarImage
                          src={recipient.avatar || '/placeholder.svg'}
                          alt={recipient.name}
                        />
                        <AvatarFallback className='bg-primary-100 text-primary-800 text-xs'>
                          {recipient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {item.suggestedTo.length > 2 && (
                      <span className='text-muted-foreground ml-0.5 flex-shrink-0 text-xs'>
                        +{item.suggestedTo.length - 2}
                      </span>
                    )}
                  </>
                ) : (
                  <span className='text-muted-foreground text-xs'>
                    No recipients
                  </span>
                )}
              </div>
            </div>
            <Button
              variant='ghost'
              size='sm'
              className='h-auto flex-shrink-0 rounded-full p-0.5 min-[470px]:p-1.5'
              onClick={() => toast.success('Share link copied!')}
            >
              <Share2 className='text-muted-foreground h-2.5 w-2.5 min-[470px]:h-3.5 min-[470px]:w-3.5' />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default MySuggestionCard;

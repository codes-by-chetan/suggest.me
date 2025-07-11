import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import ContentListService from '@/services/contentList.service';
import { toast } from '@/services/toast.service';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clapperboard,
  Film,
  Music,
  Share2,
  Tv,
  Youtube,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusDropdown } from '../reusables/status-dropdown';

interface ContentItem {
  id: string;
  userContentId: string;
  contentId: string;
  title: string;
  type: string;
  imageUrl?: string;
  year?: string;
  creator?: string;
  description?: string;
  suggestedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  addedAt: string;
  status: 'WantToConsume' | 'Consuming' | 'Consumed' | 'NotInterested' | null;
  whereToWatch?: string[];
  whereToRead?: string[];
  whereToListen?: string[];
}

interface MyWatchListCardProps {
  item: ContentItem;
}

function MyWatchListCard({ item }: MyWatchListCardProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(item.status);
  const [loading, setLoading] = useState({
    consumed: false,
    consuming: false,
    wantToConsume: false,
    notInterested: false,
  });

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
      case 'song':
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

  const handleStatusUpdate = async (
    newStatus: 'WantToConsume' | 'Consuming' | 'Consumed' | 'NotInterested'
  ) => {
    if (!item.userContentId) {
      toast.error('User content ID is missing!');
      return;
    }

    setLoading((prev) => ({ ...prev, [newStatus.toLowerCase()]: true }));
    try {
      const response = await ContentListService.updateContentStatus(
        item.userContentId,
        {
          status: newStatus,
        }
      );
      if (response.success) {
        setStatus(newStatus);
        toast.success('Status updated successfully!');
      } else {
        toast.error('Failed to update status!');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Something went wrong!');
    } finally {
      setLoading((prev) => ({ ...prev, [newStatus.toLowerCase()]: false }));
    }
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
          {/* Status dropdown - positioned to avoid overlap */}
          <div className='absolute top-1 right-1 z-10 min-[470px]:top-2 min-[470px]:right-2'>
            <StatusDropdown
              currentStatus={status}
              contentType={item.type}
              onStatusChange={handleStatusUpdate}
              loading={loading}
              size='sm'
            />
          </div>

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
                  {new Date(item.addedAt || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Title and creator */}
          <div className='mb-1 min-[470px]:mb-2'>
            <h3
              className='text-foreground mb-0.5 line-clamp-2 cursor-pointer text-xs font-semibold break-words min-[470px]:mb-1 min-[470px]:text-sm sm:text-base'
              onClick={() =>
                navigate({ to: getRouteForType(item.type, item.contentId) })
              }
            >
              {item.title}
            </h3>
            <p className='text-muted-foreground line-clamp-1 text-xs break-words'>
              {item.creator || 'Unknown'}
            </p>
          </div>

          {/* Description - Fixed height container */}
          <div className='mb-1 h-[24px] max-w-full overflow-hidden min-[470px]:mb-3 min-[470px]:h-[48px]'>
            <p
              className='text-foreground line-clamp-2 text-xs break-words min-[470px]:line-clamp-3'
              dangerouslySetInnerHTML={{
                __html: item.description || 'No description available.',
              }}
            />
          </div>

          {/* Spacer to push footer to bottom */}
          <div className='flex-grow'></div>

          {/* Footer */}
          <div className='border-border flex items-center justify-between border-t pt-1 min-[470px]:pt-2'>
            <div className='flex min-w-0 flex-1 items-center'>
              <div className='flex min-w-0 items-center'>
                <Avatar className='ring-primary/20 mr-1 h-2.5 w-2.5 flex-shrink-0 ring-1 min-[470px]:mr-1.5 min-[470px]:h-4 min-[470px]:w-4'>
                  <AvatarImage
                    src={item?.suggestedBy?.avatar || '/placeholder.svg'}
                    alt={item?.suggestedBy?.name}
                  />
                  <AvatarFallback className='bg-primary-100 text-primary-800 text-xs'>
                    {item?.suggestedBy?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className='text-foreground truncate text-xs font-medium'>
                  {item?.suggestedBy?.name}
                </span>
              </div>
            </div>
            <Button
              variant='ghost'
              size='sm'
              className='h-auto flex-shrink-0 rounded-full p-0.5 min-[470px]:p-1.5'
              onClick={() => toast.success('Share link copied!')}
            >
              <Share2 className='text-muted-foreground h-2.5 w-2.5 min-[470px]:h-4 min-[470px]:w-4' />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default MyWatchListCard;

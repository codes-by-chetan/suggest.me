/* eslint-disable @typescript-eslint/no-explicit-any */
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from '@tanstack/react-router';
import {
  Film,
  BookOpen,
  Tv,
  Youtube,
  Users,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VerifiedBadgeIcon from '../profile/VerifiedBadgeIcon';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  contentType?: string;
  user?: {
    id: string;
    fullName: {
      firstName: string;
      lastName: string;
      _id: string;
      [key: string]: any;
    };
    avatar: string;
    fullNameString: string;
    profile: any;
  };
}
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  closePopup?: () => void;
}

const NotificationItem = ({
  notification,
  onMarkAsRead,
  closePopup = () => {},
}: NotificationItemProps) => {
  const navigate = useNavigate();
  const getIconForContentType = (type?: string, notificationType?: string) => {
    if (!type && !notificationType) return <Bell className='h-4 w-4' />;

    // Handle notification types without contentType (e.g., FollowRequest)
    if (!type) {
      switch (notificationType) {
        case 'FollowRequest':
        case 'FollowAccepted':
          return <Users className='h-4 w-4' />;
        case 'System':
        case 'Mention':
        case 'Other':
          return <Bell className='h-4 w-4' />;
        default:
          return null;
      }
    }

    // Handle contentType-based icons
    switch (type) {
      case 'movie':
        return <Film className='h-4 w-4' />;
      case 'book':
        return <BookOpen className='h-4 w-4' />;
      case 'series':
        return <Tv className='h-4 w-4' />;
      case 'video':
        return <Youtube className='h-4 w-4' />;
      case 'comment':
        return <MessageSquare className='h-4 w-4' />;
      case 'other':
        return <Bell className='h-4 w-4' />;
      default:
        return null;
    }
  };
  const handleUserClick = () => {
    closePopup();
    if (notification.user?.id) {
      navigate({ to: `/profile/${notification.user.id}` });
    }
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={cn(
        'hover:bg-accent/50 flex cursor-pointer items-start gap-3 p-3 transition-colors',
        !notification.read && 'bg-primary/5 dark:bg-primary/10'
      )}
      onClick={handleClick}
    >
      {notification.user ? (
        <Avatar
          className='ring-primary/20 h-8 w-8 ring-1'
          onClick={handleUserClick}
        >
          <AvatarImage
            src={notification.user.avatar}
            alt={notification.user.fullNameString}
          />
          <AvatarFallback className='bg-primary-100 text-primary-800 font-bold'>
            {notification.user.fullName.firstName.charAt(0)}
            {notification.user.fullName.lastName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
          {getIconForContentType(notification.contentType, notification.type)}
        </div>
      )}
      <div className='min-w-0 flex-1'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center justify-center gap-1'>
            <p
              className='line-clamp-1 text-sm font-medium'
              onClick={handleUserClick}
            >
              {notification.user ? notification.user.fullNameString : ' '}
            </p>
            {notification.user?.profile.isVerified && (
              <VerifiedBadgeIcon className='h-4 w-4 sm:h-5 sm:w-5' />
            )}
          </div>
          <span className='text-muted-foreground text-xs whitespace-nowrap'>
            {formatDistanceToNow(new Date(notification.timestamp), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className='text-muted-foreground line-clamp-2 text-xs'>
          {notification.message}
        </p>
      </div>
      {!notification.read && (
        <div className='bg-primary mt-1 h-2 w-2 flex-shrink-0 rounded-full'></div>
      )}
    </div>
  );
};

export default NotificationItem;

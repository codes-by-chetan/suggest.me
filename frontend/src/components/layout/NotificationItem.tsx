import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Film, BookOpen, Tv, Music, Youtube, Instagram } from "lucide-react";

export interface Notification {
  id: string;
  type: "suggestion" | "friend_request" | "like" | "comment" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  contentType?: "movie" | "book" | "anime" | "song" | "youtube" | "reels";
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = ({
  notification,
  onMarkAsRead,
}: NotificationItemProps) => {
  const getIconForContentType = (type?: string) => {
    if (!type) return null;

    switch (type) {
      case "movie":
        return <Film className="h-4 w-4" />;
      case "book":
        return <BookOpen className="h-4 w-4" />;
      case "anime":
        return <Tv className="h-4 w-4" />;
      case "song":
        return <Music className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      case "reels":
        return <Instagram className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleClick = () => {
    onMarkAsRead(notification.id);
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer",
        !notification.read && "bg-primary/5 dark:bg-primary/10",
      )}
      onClick={handleClick}
    >
      {notification.user ? (
        <Avatar className="h-8 w-8 ring-1 ring-primary/20">
          <AvatarImage
            src={notification.user.avatar}
            alt={notification.user.name}
          />
          <AvatarFallback className="bg-primary-100 text-primary-800">
            {notification.user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {notification.contentType ? (
            getIconForContentType(notification.contentType)
          ) : (
            <span className="text-xs font-bold text-primary">!</span>
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <p className="font-medium text-sm line-clamp-1">
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(notification.timestamp).toLocaleDateString()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
      </div>
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1"></div>
      )}
    </div>
  );
};

export default NotificationItem;

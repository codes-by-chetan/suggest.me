import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  Bookmark,
  BookOpen,
  CheckCircle,
  Clock,
  Film,
  Heart,
  Instagram,
  MessageCircle,
  Music,
  Share2,
  Tv,
  Youtube,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { SuggestedToMeItem } from "./data/suggestedToMe";
import { useNavigate } from "@tanstack/react-router";


interface SuggestedToMeCardProps {
  item: SuggestedToMeItem
  handleMarkAsWatched: (id: number | string) => void
  handleMarkAsWatching: (id: number | string) => void
  handleAddToWatchlist: (id: number | string) => void
}

function SuggestedToMeCard({
  item,
  handleMarkAsWatched,
  handleMarkAsWatching,
  handleAddToWatchlist,
}: SuggestedToMeCardProps) {
  const navigate = useNavigate();
  const getIconForType = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="h-5 w-5" />;
      case "book":
        return <BookOpen className="h-5 w-5" />;
      case "anime":
        return <Tv className="h-5 w-5" />;
      case "song":
        return <Music className="h-5 w-5" />;
      case "youtube":
        return <Youtube className="h-5 w-5" />;
      case "reels":
        return <Instagram className="h-5 w-5" />;
      default:
        return <Film className="h-5 w-5" />;
    }
  };

  const getContentSpecificStatusLabel = (
    status: string,
    type: string
  ): string => {
    if (status === "watchlist") return "In Watchlist";
    if (status === "readlist") return "In Reading List";
    if (status === "listenlist") return "In Listening List";

    switch (type) {
      case "book":
        return status === "finished" ? "Finished" : "Reading";
      case "song":
        return status === "listened" ? "Listened" : "Listening";
      default:
        return status === "watched" ? "Watched" : "Watching";
    }
  };

  return (
    <Card
      key={item.id}
      
      className="overflow-hidden bg-background dark:bg-muted shadow-[5px_4px_20px_0_rgb(100,116,139)] dark:shadow-social-dark transition-all hover:shadow-[10px_8px_20px_0_rgb(100,116,139)] dark:hover:shadow-[10px_8px_20px_0_rgb(100,116,139)] border-0 cursor-pointer p-0"
    >
      <div className="flex flex-col h-full relative">
        {item.imageUrl && (
          <div
            className="w-full h-40 bg-muted"
            onClick={() =>
              navigate({to: `/content/${item.id}`})
            }
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <CardContent className="flex-1 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-full">
                {getIconForType(item.type)}
              </div>
              <span className="text-xs font-medium text-primary capitalize">
                {item.type}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(item.suggestedAt).toLocaleDateString()}
            </span>
          </div>
          <h3
            className="font-semibold text-lg mb-1 line-clamp-1 text-foreground"
            onClick={() =>
              navigate({to: `/content/${item.id}`})
            }
          >
            {item.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            {item.creator} • {item.year}
          </p>
          <p className="text-sm line-clamp-2 mb-4 text-foreground">
            {item.description}
          </p>

          {/* Status indicator */}
          {item.status && (
            <div className="absolute top-2 right-2 z-10">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.status === "watched" ||
                  item.status === "finished" ||
                  item.status === "listened"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : item.status === "watching" ||
                      item.status === "reading" ||
                      item.status === "listening"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                }`}
              >
                {item.status === "watched" ||
                item.status === "finished" ||
                item.status === "listened" ? (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {getContentSpecificStatusLabel(item.status, item.type)}
                  </>
                ) : item.status === "watching" ||
                  item.status === "reading" ||
                  item.status === "listening" ? (
                  <>
                    <Clock className="mr-1 h-3 w-3" />
                    {getContentSpecificStatusLabel(item.status, item.type)}
                  </>
                ) : item.status === "watchlist" ? (
                  <>
                    <Bookmark className="mr-1 h-3 w-3" />
                    In Watchlist
                  </>
                ) : item.status === "readlist" ? (
                  <>
                    <Bookmark className="mr-1 h-3 w-3" />
                    In Reading List
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-1 h-3 w-3" />
                    In Listening List
                  </>
                )}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <Button
              variant={
                item.status === "finished" ||
                item.status === "listened" ||
                item.status === "watched"
                  ? "default"
                  : "outline"
              }
              size="sm"
              className={`rounded-full text-xs flex-1 ${
                item.status === "finished" ||
                item.status === "listened" ||
                item.status === "watched"
                  ? "bg-primary text-white"
                  : ""
              }`}
              onClick={() => handleMarkAsWatched(item.id)}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {item.type === "book"
                ? "Finished"
                : item.type === "song"
                ? "Listened"
                : "Watched"}
            </Button>

            <Button
              variant={
                item.status === "reading" ||
                item.status === "listening" ||
                item.status === "watching"
                  ? "default"
                  : "outline"
              }
              size="sm"
              className={`rounded-full text-xs flex-1 ${
                item.status === "reading" ||
                item.status === "listening" ||
                item.status === "watching"
                  ? "bg-primary text-white"
                  : ""
              }`}
              onClick={() => handleMarkAsWatching(item.id)}
            >
              <Clock className="h-3 w-3 mr-1" />
              {item.type === "book"
                ? "Reading"
                : item.type === "song"
                ? "Listening"
                : "Watching"}
            </Button>

            <Button
              variant={
                item.status === "readlist" ||
                item.status === "listenlist" ||
                item.status === "watchlist"
                  ? "default"
                  : "outline"
              }
              size="sm"
              className={`rounded-full text-xs flex-1 ${
                item.status === "readlist" ||
                item.status === "listenlist" ||
                item.status === "watchlist"
                  ? "bg-primary text-white"
                  : ""
              }`}
              onClick={() => handleAddToWatchlist(item.id)}
            >
              <Bookmark className="h-3 w-3 mr-1" />
              {item.type === "book"
                ? "Reading List"
                : item.type === "song"
                ? "Listening List"
                : "Watchlist"}
            </Button>
          </div>

          {/* Social media style interaction buttons */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full p-2 h-auto"
            >
              <Heart className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full p-2 h-auto"
            >
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full p-2 h-auto"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          <div className="flex items-center pt-3 border-t border-border">
            <span className="text-xs font-medium text-foreground mr-2">
              Suggested by:
            </span>
            <div className="flex items-center">
              <Avatar className="h-5 w-5 mr-1 ring-1 ring-primary/20">
                <AvatarImage
                  src={item?.suggestedBy?.avatar}
                  alt={item?.suggestedBy?.name}
                />
                <AvatarFallback className="bg-primary-100 text-primary-800">
                  {item?.suggestedBy?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground">
                {item?.suggestedBy?.name}
              </span>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default SuggestedToMeCard;

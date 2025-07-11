"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, Book, Film, Tv, Library } from "lucide-react";
import type { SearchResultItem } from "@/interfaces/search.interface";
import { useNavigate } from "react-router-dom";
import VerifiedBadgeIcon from "@/components/profile/VerifiedBadgeIcon";

interface SearchResultItemProps {
  item: SearchResultItem;
  index: number;
  activeTab: string;
  imageFailed: boolean;
  getPosterUrl: (item: SearchResultItem) => string;
  onImageError: () => void;
}

export function SearchResultItemComponent({
  item,
  index,
  activeTab,
  imageFailed,
  getPosterUrl,
  onImageError,
}: SearchResultItemProps) {
  const navigate = useNavigate();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "music":
      case "songs":
        return <Music className="h-12 w-8 text-muted-foreground" />;
      case "book":
        return <Book className="h-12 w-8 text-muted-foreground" />;
      case "movie":
        return <Film className="h-12 w-8 text-muted-foreground" />;
      case "series":
        return <Tv className="h-12 w-8 text-muted-foreground" />;
      default:
        return <Library className="h-12 w-8 text-muted-foreground" />;
    }
  };

  const clipPlot = (plot: string | undefined) => {
    if (!plot) return "";
    return plot.length > 40 ? `${plot.slice(0, 40)}...` : plot;
  };

  const handleItemClick = () => {
    if (activeTab === "users") {
      // Navigate to user profile
      navigate(`/profile/${item._id}`);
    } else {
      // Navigate to content detail page based on category
      const category = item.category || activeTab;
      let route = "";

      switch (category) {
        case "movie":
          route = `/movies/${item.imdbId || item._id || item.tmdbId}`;
          break;
        case "series":
          route = `/series/${item.imdbId || item._id || item.tmdbId}`;
          break;
        case "book":
          route = `/books/${item.googleBooksId || item._id}`;
          break;
        case "music":
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

      navigate(route);
    }
  };

  const getDisplayName = () => {
    if (activeTab === "users") {
      if (item.fullName) {
        return `${item.fullName.firstName} ${item.fullName.lastName}`.trim();
      }
      return item.profile?.displayName || "Unknown User";
    }
    return item.title || item.name || "Unknown";
  };

  const getAvatarUrl = () => {
    if (activeTab === "users") {
      return item.profile?.avatar?.url || item.profileImage?.url || "";
    }
    return "";
  };
  
  return (
    <div
      className="flex items-start gap-2 p-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors w-full box-border overflow-hidden min-h-16"
      role="listitem"
      onClick={handleItemClick}
    >
      {activeTab === "users" ? (
        <>
          <Avatar className="h-12 w-12 flex-shrink-0">
            {getAvatarUrl() ? (
              <AvatarImage
                src={getAvatarUrl() || "/placeholder.svg"}
                alt={getDisplayName()}
              />
            ) : (
              <AvatarFallback>
                {getDisplayName().charAt(0) || "U"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm line-clamp-2 break-words">
              {getDisplayName()}
            </p>
            {item?.profile.isVerified && (
                <VerifiedBadgeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            {item.profile?.bio && (
              <p className="text-xs text-muted-foreground truncate break-words">
                {clipPlot(item.profile.bio)}
              </p>
            )}
            {item.profile?.displayName && (
              <p className="text-xs text-muted-foreground truncate break-words">
                {clipPlot(item.profile.displayName)}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          {imageFailed || !getPosterUrl(item) ? (
            <div className="h-12 w-8 flex items-center justify-center flex-shrink-0">
              {getCategoryIcon(item.category || activeTab)}
            </div>
          ) : (
            <img
              src={getPosterUrl(item) || "/placeholder.svg"}
              alt={getDisplayName()}
              className="h-12 w-8 object-cover rounded flex-shrink-0"
              onError={onImageError}
            />
          )}
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="font-semibold text-sm line-clamp-2 break-words">
              {getDisplayName()}
            </p>
            <p className="text-xs text-muted-foreground truncate break-words">
              {item.category || activeTab} {item.year ? `(${item.year})` : ""}
            </p>
            <p className="text-xs max-w-full text-muted-foreground truncate break-words">
              {clipPlot(item.plot)}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

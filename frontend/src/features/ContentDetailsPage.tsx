import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  Film,
  BookOpen,
  Tv,
  Music,
  Youtube,
  Instagram,
  ArrowLeft,
  ExternalLink,
  Clock,
  Bookmark,
  CheckCircle,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface ContentDetails {
  id: string;
  title: string;
  type: string;
  imageUrl?: string;
  year?: string;
  creator?: string;
  description?: string;
  status?:
    | "watched"
    | "watching"
    | "watchlist"
    | "finished"
    | "reading"
    | "listened"
    | "listening"
    | "readlist"
    | "listenlist"
    | null;
  suggestedBy?: {
    id: string;
    name: string;
    avatar?: string;
  };
  suggestedTo?: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  suggestedAt?: string;
  whereToWatch?: string[];
  whereToRead?: string[];
  whereToListen?: string[];
}

const ContentDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const contentDetails = location.state?.contentDetails as
    | ContentDetails
    | undefined;

  // If no content details were passed, we would fetch them here
  // For now, we'll just show a message if no details are available
  if (!contentDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold">Content not found</h2>
              <p className="text-muted-foreground mt-2">
                The content you're looking for doesn't exist or couldn't be
                loaded.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
    type: string,
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

  const getWhereToConsume = () => {
    switch (contentDetails.type) {
      case "book":
        return (
          contentDetails.whereToRead || [
            "Amazon",
            "Barnes & Noble",
            "Local Library",
          ]
        );
      case "song":
        return (
          contentDetails.whereToListen || [
            "Spotify",
            "Apple Music",
            "YouTube Music",
          ]
        );
      default:
        return (
          contentDetails.whereToWatch || ["Netflix", "Hulu", "Amazon Prime"]
        );
    }
  };

  const getWhereToConsumeLabel = () => {
    switch (contentDetails.type) {
      case "book":
        return "Where to Read";
      case "song":
        return "Where to Listen";
      default:
        return "Where to Watch";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left column - Image */}
            <div className="md:col-span-1">
              <div className="rounded-lg overflow-hidden bg-muted shadow-lg">
                {contentDetails.imageUrl ? (
                  <img
                    src={contentDetails.imageUrl}
                    alt={contentDetails.title}
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-primary/10">
                    {getIconForType(contentDetails.type)}
                  </div>
                )}
              </div>

              {/* Status indicator */}
              {contentDetails.status && (
                <div className="mt-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${contentDetails.status === "watched" || contentDetails.status === "finished" || contentDetails.status === "listened" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : contentDetails.status === "watching" || contentDetails.status === "reading" || contentDetails.status === "listening" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"}`}
                  >
                    {contentDetails.status === "watched" ||
                    contentDetails.status === "finished" ||
                    contentDetails.status === "listened" ? (
                      <>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        {getContentSpecificStatusLabel(
                          contentDetails.status,
                          contentDetails.type,
                        )}
                      </>
                    ) : contentDetails.status === "watching" ||
                      contentDetails.status === "reading" ||
                      contentDetails.status === "listening" ? (
                      <>
                        <Clock className="mr-1 h-4 w-4" />
                        {getContentSpecificStatusLabel(
                          contentDetails.status,
                          contentDetails.type,
                        )}
                      </>
                    ) : (
                      <>
                        <Bookmark className="mr-1 h-4 w-4" />
                        {getContentSpecificStatusLabel(
                          contentDetails.status,
                          contentDetails.type,
                        )}
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Where to watch/read/listen */}
              <div className="mt-6 bg-card rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-lg mb-3">
                  {getWhereToConsumeLabel()}
                </h3>
                <div className="space-y-2">
                  {getWhereToConsume().map((place, index) => (
                    <a
                      key={index}
                      href="#"
                      className="flex items-center justify-between p-2 hover:bg-accent rounded-md transition-colors"
                    >
                      <span>{place}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column - Content details */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-full">
                  {getIconForType(contentDetails.type)}
                </div>
                <span className="text-sm font-medium text-primary capitalize">
                  {contentDetails.type}
                </span>
              </div>

              <h1 className="text-3xl font-bold mb-2">
                {contentDetails.title}
              </h1>

              <p className="text-muted-foreground mb-4">
                {contentDetails.creator} • {contentDetails.year}
              </p>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-foreground">{contentDetails.description}</p>
              </div>

              {/* Social media style interaction buttons */}
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Like
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Comment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              <Separator className="my-6" />

              {/* Suggested by or to section */}
              {contentDetails.suggestedBy && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">Suggested by</h2>
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3 ring-2 ring-primary/20">
                      <AvatarImage
                        src={contentDetails.suggestedBy.avatar}
                        alt={contentDetails.suggestedBy.name}
                      />
                      <AvatarFallback>
                        {contentDetails.suggestedBy.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {contentDetails.suggestedBy.name}
                      </p>
                      {contentDetails.suggestedAt && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(
                            contentDetails.suggestedAt,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {contentDetails.suggestedTo &&
                contentDetails.suggestedTo.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3">Suggested to</h2>
                    <div className="flex flex-wrap gap-2">
                      {contentDetails.suggestedTo.map((recipient) => (
                        <div
                          key={recipient.id}
                          className="flex items-center bg-accent hover:bg-accent/80 rounded-full py-1 px-3 transition-colors"
                        >
                          <Avatar className="h-6 w-6 mr-2 ring-1 ring-primary/20">
                            <AvatarImage
                              src={recipient.avatar}
                              alt={recipient.name}
                            />
                            <AvatarFallback>
                              {recipient.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {recipient.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContentDetailsPage;

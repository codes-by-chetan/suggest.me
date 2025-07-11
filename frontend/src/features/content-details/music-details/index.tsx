import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  ExternalLink,
  Music,
  Clock,
  Bookmark,
  CheckCircle,
  Heart,
  MessageCircle,
  Share2,
  Star,
  Award,
  Tag,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getMusicDetails, MusicDetails } from "@/services/content.service";
import {
  checkContent,
  addContent,
  updateContentStatus,
} from "@/services/contentList.service";
import { toast } from "@/services/toast.service";
import { useAuth } from "@/lib/auth-context";
import AuthDialog from "@/components/layout/AuthDialog";

const formatPlays = (plays: string): string => {
  const num = parseInt(plays.replace(/,/g, ""));
  if (isNaN(num)) return "0";
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(num % 1000000 >= 100000 ? 1 : 0)}M+`;
  } else if (num >= 100000) {
    return `${Math.floor(num / 1000)}k`;
  } else if (num >= 10000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

const MusicDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<MusicDetails | null>(null);
  const [contentStatus, setContentStatus] = useState<string | null>(null);
  const [contentRecordId, setContentRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    const fetchMusicContent = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getMusicDetails(id);
        if (response.success && response.data) {
          setContent(response.data);
        } else {
          setError(response.message || "Failed to fetch music details");
        }
      } catch (err) {
        setError("An error occurred while fetching music details");
      } finally {
        setLoading(false);
      }
    };

    fetchMusicContent();
  }, [id]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!content?._id) return;
      try {
        const response = await checkContent({ contentId: content?._id });
        if (response.success && response.data) {
          setContentStatus(response.data.status || null);
          setContentRecordId(response.data.id || null);
        } else {
          setContentStatus(null);
          setContentRecordId(null);
        }
      } catch (err: any) {
        toast.error("Failed to fetch content status.");
      }
    };

    fetchStatus();
  }, [content?._id, isAuthenticated]);
  const updateStatus = async (newStatus: string) => {
    if (!content) return;
    if (newStatus === "add-to-list") return;
    try {
      let response;
      if (contentRecordId) {
        response = await updateContentStatus(contentRecordId, {
          status: newStatus,
        });
        if (response.success) {
          setContentStatus(newStatus);
          toast.success("Content status updated successfully.");
        } else {
          throw new Error(
            response.message || "Failed to update content status."
          );
        }
      } else {
        response = await addContent({
          content: { id: content?._id, type: "Music" },
          status: newStatus,
          suggestionId: undefined,
        });
        if (response.success && response.data) {
          setContentStatus(newStatus);
          setContentRecordId(response.data.id);
          toast.success("Content added successfully.");
        } else {
          throw new Error(response.message || "Failed to add content.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred. Please try again.");
    } finally {
      setIsPopoverOpen(false);
    }
  };
  const handleAuthDialogClose = useCallback(
    (success: boolean = false) => {
      if (success) {
        updateStatus(newStatus);
      } else {
        toast.error("Failed : Login first to change status");
      }
      setIsAuthDialogOpen(false);
      setNewStatus(null);
    },
    [isAuthenticated, newStatus]
  );

  const handleStatusChange = async (newStatus: string) => {
    if (!isAuthenticated) {
      setIsAuthDialogOpen(true);
      setNewStatus(newStatus);
      return;
    }
    updateStatus(newStatus);
  };

  const getStatusBadgeColor = (status: string | null) => {
    if (status === "Consumed") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    } else if (status === "Consuming") {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    } else if (status === "WantToConsume") {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    } else if (status === "NotInterested") {
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    } else {
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusOptions = () => {
    const baseOptions = [
      { value: "Consumed", label: "Listened" },
      { value: "Consuming", label: "Listening" },
      { value: "WantToConsume", label: "Listening List" },
      { value: "NotInterested", label: "Not Interested" },
    ];
    if (!contentRecordId) {
      return [
        { value: "add-to-list", label: "Add to Your List" },
        ...baseOptions,
      ];
    }
    return baseOptions;
  };

  const getContentSpecificStatusLabel = (status: string | null): string => {
    if (!status) return "Add to Your List";
    if (status === "NotInterested") return "Not Interested";
    if (status === "WantToConsume") return "Listening List";
    return status === "Consumed" ? "Listened" : "Listening";
  };

  if (loading) {
    return (
      <main className="w-full mx-auto pb-[10vh] pt-0 px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold">Loading...</h2>
          </div>
        </div>
      </main>
    );
  }

  if (error || !content) {
    return (
      <main className="w-full mx-auto pb-[10vh] pt-0 px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold">Music Not Found</h2>
            <p className="text-muted-foreground mt-2">
              {error ||
                "The music you are looking for does not exist or could not be loaded."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full mx-auto pb-[10vh] pt-0 px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="rounded-lg overflow-hidden bg-muted shadow-lg">
              {content.album.coverImage?.url ? (
                <img
                  src={content.album.coverImage.url}
                  alt={content.title}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-primary/10">
                  <Music className="h-8 w-8" />
                </div>
              )}
            </div>

            <div className="mt-6 bg-card rounded-lg p-4 shadow-sm">
              <h3 className="font-medium text-lg mb-3">Where to Listen</h3>
              <div className="space-y-2">
                {content.availableOn.spotify ? (
                  <a
                    href={content.availableOn.spotify.link}
                    target="_blank"
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">
                        Spotify
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatPlays(content.availableOn.spotify.plays)} plays
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Not available</p>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-full">
                <Music className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-primary capitalize">
                Music
              </span>
            </div>

            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold">{content.title}</h1>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                      contentStatus
                    )} hover:opacity-80 transition-opacity`}
                    aria-label="Change content status"
                  >
                    {contentStatus === "Consumed" ? (
                      <CheckCircle className="mr-1 h-4 w-4" />
                    ) : contentStatus === "Consuming" ? (
                      <Clock className="mr-1 h-4 w-4" />
                    ) : contentStatus === "WantToConsume" ? (
                      <Bookmark className="mr-1 h-4 w-4" />
                    ) : contentStatus === "NotInterested" ? (
                      <XCircle className="mr-1 h-4 w-4" />
                    ) : (
                      <Bookmark className="mr-1 h-4 w-4" />
                    )}
                    {getContentSpecificStatusLabel(contentStatus)}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2">
                  <div className="space-y-1">
                    {getStatusOptions().map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                          option.value === contentStatus
                            ? "bg-primary/10 text-foreground cursor-not-allowed"
                            : "hover:bg-accent"
                        } disabled:opacity-50`}
                        disabled={
                          option.value === "add-to-list" ||
                          option.value === contentStatus
                        }
                      >
                        {option.value === "add-to-list" ? (
                          <Bookmark className="h-4 w-4" />
                        ) : option.value === "Consumed" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : option.value === "Consuming" ? (
                          <Clock className="h-4 w-4" />
                        ) : option.value === "WantToConsume" ? (
                          <Bookmark className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <p className="text-muted-foreground mb-4">
              {[
                content.artist.name,
                content.featuredArtists.map((a) => a.name).join(", "),
                content.releaseYear,
                content.album.title,
                content.duration,
                content.language || "Unknown",
                content.recordLabel.name,
              ]
                .filter(Boolean)
                .join(" • ")}
            </p>

            {content.genres.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-lg">Genres</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {content.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent text-sm rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {content.mood.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5" /> Mood
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {content.mood.map((mood, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent text-sm rounded-full"
                    >
                      {mood}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <Award className="h-5 w-5" /> Awards
              </h3>
              <div className="mt-2">
                <p>
                  Grammys: {content.awards.grammys.wins} wins,{" "}
                  {content.awards.grammys.nominations} nominations
                </p>
                <p>
                  Billboard Music Awards:{" "}
                  {content.awards.billboardMusicAwards.wins} wins,{" "}
                  {content.awards.billboardMusicAwards.nominations} nominations
                </p>
                <p>
                  Total: {content.awards.wins} wins,{" "}
                  {content.awards.nominations} nominations
                </p>
              </div>
            </div>

            {content.productionCompanies.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-lg">Production</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {content.productionCompanies.map((company, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent text-sm rounded-full"
                    >
                      {company.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(content.writers.length > 0 ||
              content.producers.length > 0 ||
              content.engineers.length > 0) && (
              <div className="mb-4">
                <h3 className="font-medium text-lg">Crew</h3>
                <div className="mt-2">
                  {content.writers.length > 0 && (
                    <p>Writers: {content.writers.join(", ")}</p>
                  )}
                  {content.producers.length > 0 && (
                    <p>Producers: {content.producers.join(", ")}</p>
                  )}
                  {content.engineers.length > 0 && (
                    <p>Engineers: {content.engineers.join(", ")}</p>
                  )}
                </div>
              </div>
            )}

            {content.formats.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-lg">Formats</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {content.formats.map((format, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent text-sm rounded-full"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {content.remixes.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-lg">Remixes</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {content.remixes.map((remix, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent text-sm rounded-full"
                    >
                      {remix}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {content.artist.biography && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-foreground">{content.artist.biography}</p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Artists</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[content.artist, ...content.featuredArtists].map(
                  (artist, index) => (
                    <div key={index} className="flex items-center">
                      <Avatar className="h-16 w-16 mr-3 ring-1 ring-primary/20">
                        <AvatarImage
                          src={artist.profileImage?.url}
                          alt={artist.name}
                        />
                        <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{artist.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {artist.professions.join(", ")}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
              >
                <Heart className="h-4 w-4" /> Like
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
              >
                <MessageCircle className="h-4 w-4" /> Comment
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
              >
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>

            <Separator className="my-6" />
          </div>
        </div>
      </div>
      <AuthDialog isOpen={isAuthDialogOpen} onClose={handleAuthDialogClose} />
    </main>
  );
};

export default MusicDetailsPage;

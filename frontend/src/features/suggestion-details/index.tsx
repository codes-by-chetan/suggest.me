import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Film, Clapperboard, ArrowLeft, FileText } from "lucide-react";
import AuthenticationFallback from "@/components/layout/AuthenticationFallback";
import { getSuggestionDetails } from "@/services/suggestion.service";
import { useAuth } from "@/lib/auth-context";

const SuggestionDetails = () => {
  const { isAuthenticated } = useAuth();
  const { suggestionId } = useParams();
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullPlot, setShowFullPlot] = useState(false);
  const navigate = useNavigate();

  const getRouteForType = (type: string, contentId: string) => {
    switch (type) {
      case "Movie":
        return `/movies/${contentId}`;
      case "Series":
        return `/series/${contentId}`;
      case "Book":
        return `/books/${contentId}`;
      case "Music":
      case "albums":
        return `/music/${contentId}`;
      case "Video":
        return `/videos/${contentId}`;
      case "People":
        return `/people/${contentId}`;
      case "Users":
        return `/profile/${contentId}`;
      default:
        return "#";
    }
  };

  useEffect(() => {
    const fetchSuggestion = async () => {
      setLoading(true);
      try {
        const response = await getSuggestionDetails(suggestionId);
        console.log(response);
        if (response.success) {
          setSuggestion(response.data);
          console.log(response.data);
        } else {
          setError(response.message || "Failed to fetch suggestion details");
        }
      } catch (err) {
        setError("An error occurred while fetching suggestion details");
        console.error("Error fetching suggestion details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (suggestionId) {
      fetchSuggestion();
    }
  }, [suggestionId]);

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthenticationFallback
        title="Please Sign In"
        description="Sign in or create an account to view detailed suggestion information and discover what your friends are recommending."
        icon={<FileText className="h-10 w-10 text-primary" />}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Loading...</h2>
        </div>
      </div>
    );
  }

  if (error || !suggestion) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Suggestion not found</h2>
          <p className="text-muted-foreground mt-2">
            {error || "The suggestion you're looking for doesn't exist."}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const plotLines = suggestion.content?.plot
    ? suggestion.content?.plot?.split(". ")
    : [];
  const shortPlot =
    plotLines.slice(0, 3).join(". ") + (plotLines.length > 3 ? "." : "");

  return (
    <main className="w-full mx-auto py-0 pb-[10vh] px-4 sm:px-6 lg:px-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column - Poster */}
        <div className="md:col-span-1">
          <div className="rounded-lg overflow-hidden bg-muted shadow-lg">
            {suggestion.content.poster?.url ? (
              <img
                src={suggestion.content?.poster?.url || "/placeholder.svg"}
                alt={suggestion.content.title}
                className="w-full h-auto object-cover"
              />
            ) : suggestion.content?.coverImage?.url ? (
              <img
                src={suggestion.content?.coverImage?.url || "/placeholder.svg"}
                alt={suggestion.content.title}
                className="w-full h-auto object-cover"
              />
            ) : suggestion.content?.album?.coverImage?.url ? (
              <img
                src={
                  suggestion.content?.album?.coverImage?.url ||
                  "/placeholder.svg"
                }
                alt={suggestion.content.title}
                className="w-full h-auto object-cover"
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-primary/10">
                <Film className="h-8 w-8" />
              </div>
            )}
          </div>
        </div>

        {/* Right column - Suggestion details */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-full">
              <Film className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-primary capitalize">
              {suggestion?.contentType}
            </span>
          </div>

          <h1
            className="text-3xl font-bold mb-2 cursor-pointer"
            onClick={() => {
              navigate(
                getRouteForType(
                  suggestion?.contentType,
                  suggestion?.content?._id
                )
              );
            }}
          >
            {suggestion?.content?.title}
          </h1>

          <p className="text-muted-foreground mb-4">
            {[
              suggestion?.content?.year,
              suggestion?.content?.director?.join(", "),
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>

          {/* Plot */}
          {suggestion?.content?.plot && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Plot</h2>
              <p className="text-foreground">
                {showFullPlot ? suggestion?.content?.plot : shortPlot}
              </p>
              {plotLines.length > 3 && (
                <Button
                  variant="link"
                  className="mt-2 p-0"
                  onClick={() => setShowFullPlot(!showFullPlot)}
                >
                  {showFullPlot ? "Show Less" : "Show More"}
                </Button>
              )}
            </div>
          )}

          {/* Studios */}
          {suggestion.content?.production?.studios?.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <Clapperboard className="h-5 w-5" /> Studios
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestion?.content?.production?.studios.map(
                  (studio, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent text-sm rounded-full"
                    >
                      {studio}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Suggested by */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Suggested by</h2>
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3 ring-2 ring-primary/20">
                <AvatarImage
                  src={
                    suggestion?.sender?.profile?.avatar?.url ||
                    "/placeholder.svg"
                  }
                  alt={suggestion?.sender?.fullNameString}
                />
                <AvatarFallback>
                  {suggestion?.sender?.fullNameString?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {suggestion?.sender?.profile?.displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(suggestion?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Suggested to */}
          {suggestion.recipients?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Suggested to</h2>
              <div className="flex flex-wrap gap-2">
                {suggestion.recipients.map((recipient, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-accent hover:bg-accent/80 rounded-full py-1 px-3 transition-colors"
                  >
                    <Avatar className="h-6 w-6 mr-2 ring-1 ring-primary/20">
                      <AvatarImage
                        src={recipient?.profile?.avatar?.url }
                        alt={recipient.fullNameString}
                      />
                      <AvatarFallback>
                        {recipient?.fullName?.firstName?.charAt(0)}{recipient?.fullName?.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {recipient.fullNameString}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default SuggestionDetails;

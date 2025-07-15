/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { getSuggestionDetails } from '@/services/suggestion.service';
import { Film, Clapperboard, ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import AuthenticationFallback from '@/components/layout/AuthenticationFallback';

const SuggestionDetails = () => {
  const { isAuthenticated } = useAuth();
  const { suggestionId } = useParams({
    from: '/suggestion-details/:suggestionId',
  });
  const [suggestion, setSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullPlot, setShowFullPlot] = useState(false);
  const navigate = useNavigate();

  const getRouteForType = (type: string, contentId: string) => {
    switch (type) {
      case 'Movie':
        return `/movies/${contentId}`;
      case 'Series':
        return `/series/${contentId}`;
      case 'Book':
        return `/books/${contentId}`;
      case 'Music':
      case 'albums':
        return `/music/${contentId}`;
      case 'Video':
        return `/videos/${contentId}`;
      case 'People':
        return `/people/${contentId}`;
      case 'Users':
        return `/profile/${contentId}`;
      default:
        return '#';
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
          setError(response.message || 'Failed to fetch suggestion details');
        }
      } catch (err) {
        setError('An error occurred while fetching suggestion details');
        console.error('Error fetching suggestion details:', err);
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
        title='Please Sign In'
        description='Sign in or create an account to view detailed suggestion information and discover what your friends are recommending.'
        icon={<FileText className='text-primary h-10 w-10' />}
      />
    );
  }

  if (loading) {
    return (
      <div className='bg-background min-h-screen p-4'>
        <div className='py-12 text-center'>
          <h2 className='text-2xl font-bold'>Loading...</h2>
        </div>
      </div>
    );
  }

  if (error || !suggestion) {
    return (
      <div className='bg-background min-h-screen p-4'>
        <div className='py-12 text-center'>
          <h2 className='text-2xl font-bold'>Suggestion not found</h2>
          <p className='text-muted-foreground mt-2'>
            {error || "The suggestion you're looking for doesn't exist."}
          </p>
          <Button
            variant='outline'
            className='mt-4'
            onClick={() => navigate({ to: '..' })}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const plotLines = suggestion.content?.plot
    ? suggestion.content?.plot?.split('. ')
    : [];
  const shortPlot =
    plotLines.slice(0, 3).join('. ') + (plotLines.length > 3 ? '.' : '');

  return (
    <main className='mx-auto w-full px-4 py-0 pb-[10vh] sm:px-6 lg:px-8'>
      <Button
        variant='ghost'
        className='mb-4'
        onClick={() => navigate({ to: '..' })}
      >
        <ArrowLeft className='mr-2 h-4 w-4' /> Back
      </Button>
      <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
        {/* Left column - Poster */}
        <div className='md:col-span-1'>
          <div className='bg-muted overflow-hidden rounded-lg shadow-lg'>
            {suggestion.content.poster?.url ? (
              <img
                src={suggestion.content?.poster?.url || '/placeholder.svg'}
                alt={suggestion.content.title}
                className='h-auto w-full object-cover'
              />
            ) : suggestion.content?.coverImage?.url ? (
              <img
                src={suggestion.content?.coverImage?.url || '/placeholder.svg'}
                alt={suggestion.content.title}
                className='h-auto w-full object-cover'
              />
            ) : suggestion.content?.album?.coverImage?.url ? (
              <img
                src={
                  suggestion.content?.album?.coverImage?.url ||
                  '/placeholder.svg'
                }
                alt={suggestion.content.title}
                className='h-auto w-full object-cover'
              />
            ) : (
              <div className='bg-primary/10 flex h-64 w-full items-center justify-center'>
                <Film className='h-8 w-8' />
              </div>
            )}
          </div>
        </div>

        {/* Right column - Suggestion details */}
        <div className='md:col-span-2'>
          <div className='mb-2 flex items-center gap-2'>
            <div className='bg-primary/10 dark:bg-primary/20 rounded-full p-1.5'>
              <Film className='h-5 w-5' />
            </div>
            <span className='text-primary text-sm font-medium capitalize'>
              {suggestion?.contentType}
            </span>
          </div>

          <h1
            className='mb-2 cursor-pointer text-3xl font-bold'
            onClick={() => {
              navigate({
                to: getRouteForType(
                  suggestion?.contentType,
                  suggestion?.content?._id
                ),
              });
            }}
          >
            {suggestion?.content?.title}
          </h1>

          <p className='text-muted-foreground mb-4'>
            {[
              suggestion?.content?.year,
              suggestion?.content?.director?.join(', '),
            ]
              .filter(Boolean)
              .join(' • ')}
          </p>

          {/* Plot */}
          {suggestion?.content?.plot && (
            <div className='mb-6'>
              <h2 className='mb-2 text-xl font-semibold'>Plot</h2>
              <p className='text-foreground'>
                {showFullPlot ? suggestion?.content?.plot : shortPlot}
              </p>
              {plotLines.length > 3 && (
                <Button
                  variant='link'
                  className='mt-2 p-0'
                  onClick={() => setShowFullPlot(!showFullPlot)}
                >
                  {showFullPlot ? 'Show Less' : 'Show More'}
                </Button>
              )}
            </div>
          )}

          {/* Studios */}
          {suggestion.content?.production?.studios?.length > 0 && (
            <div className='mb-4'>
              <h3 className='flex items-center gap-2 text-lg font-medium'>
                <Clapperboard className='h-5 w-5' /> Studios
              </h3>
              <div className='mt-2 flex flex-wrap gap-2'>
                {suggestion?.content?.production?.studios.map(
                  (studio: any, index: any) => (
                    <span
                      key={index}
                      className='bg-accent rounded-full px-3 py-1 text-sm'
                    >
                      {studio}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Suggested by */}
          <div className='mb-6'>
            <h2 className='mb-3 text-lg font-semibold'>Suggested by</h2>
            <div className='flex items-center'>
              <Avatar className='ring-primary/20 mr-3 h-10 w-10 ring-2'>
                <AvatarImage
                  src={
                    suggestion?.sender?.profile?.avatar?.url ||
                    '/placeholder.svg'
                  }
                  alt={suggestion?.sender?.fullNameString}
                />
                <AvatarFallback>
                  {suggestion?.sender?.fullNameString?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='font-medium'>
                  {suggestion?.sender?.profile?.displayName}
                </p>
                <p className='text-muted-foreground text-sm'>
                  {new Date(suggestion?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Suggested to */}
          {suggestion.recipients?.length > 0 && (
            <div>
              <h2 className='mb-3 text-lg font-semibold'>Suggested to</h2>
              <div className='flex flex-wrap gap-2'>
                {suggestion.recipients.map((recipient: any, index: any) => (
                  <div
                    key={index}
                    className='bg-accent hover:bg-accent/80 flex items-center rounded-full px-3 py-1 transition-colors'
                  >
                    <Avatar className='ring-primary/20 mr-2 h-6 w-6 ring-1'>
                      <AvatarImage
                        src={recipient?.profile?.avatar?.url}
                        alt={recipient.fullNameString}
                      />
                      <AvatarFallback>
                        {recipient?.fullName?.firstName?.charAt(0)}
                        {recipient?.fullName?.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className='text-sm font-medium'>
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

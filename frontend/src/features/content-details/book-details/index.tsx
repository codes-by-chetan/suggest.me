/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ContentService } from '@/services/content.service';
import ContentListService from '@/services/contentList.service';
import { toast } from '@/services/toast.service';
import {
  BookOpen,
  ArrowLeft,
  ExternalLink,
  Clock,
  Bookmark,
  CheckCircle,
  Heart,
  MessageCircle,
  Share2,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useSocket } from '@/context/socket-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import AuthDialog from '@/components/layout/AuthDialog';

interface DisplayBook {
  id: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  publishedYear?: number;
  authors?: string;
  description?: string;
  publisher?: string | { name: string; [key: string]: any };
  pages?: number;
  isbn?: string;
  genres?: string[];
  language?: string;
  status?: 'finished' | 'reading' | 'readlist' | null;
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
  whereToRead?: string[];
  awards?: {
    wins: number;
    nominations: number;
    awardsDetails: any[];
  };
  googleBooksId?: string;
  openLibraryId?: string;
}

const BookDetailsPage = () => {
  const { id } = useParams({ from: '/_authenticated/book-details/:id' });
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [book, setBook] = useState<DisplayBook | null>(null);
  const [contentStatus, setContentStatus] = useState<string | null>(null);
  const [contentRecordId, setContentRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const normalizeBookData = (data: any): DisplayBook => {
    return {
      id: data._id || '',
      title: data.title,
      subtitle: data.subtitle || undefined,
      coverUrl: data.coverImage?.url,
      publishedYear: data.publishedYear,
      authors: data.author?.map((a: any) => a.name).join(', ') || '',
      description: data.description,
      publisher: data.publisher?.name || data.publisher || '',
      pages: data.pages,
      isbn:
        data.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')
          ?.identifier ||
        data.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')
          ?.identifier,
      genres: data.genres || [],
      language: data.language,
      status: null,
      whereToRead:
        [
          ...(data.availableOn?.bookstores?.map((b: any) => b.name) || []),
          ...(data.availableOn?.ebooks?.map((e: any) => e.name) || []),
          ...(data.availableOn?.audiobooks?.map((a: any) => a.name) || []),
        ].filter(Boolean).length > 0
          ? [
              ...(data.availableOn?.bookstores?.map((b: any) => b.name) || []),
              ...(data.availableOn?.ebooks?.map((e: any) => e.name) || []),
              ...(data.availableOn?.audiobooks?.map((a: any) => a.name) || []),
            ].filter(Boolean)
          : ['Amazon', 'Barnes & Noble', 'Local Library'],
      awards: data.awards,
      googleBooksId: data.googleBooksId || '',
      openLibraryId: data.openLibraryId || undefined,
    };
  };

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await ContentService.getBookDetails(id);
        if (response.success && response.data) {
          setBook(normalizeBookData(response.data));
        } else {
          setError(response.message || 'Failed to fetch book details');
        }
      } catch (_err) {
        setError('An error occurred while fetching book details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [id]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!book?.id) return;
      try {
        const response = await ContentListService.checkContent({
          contentId: book.id,
        });
        if (response.success && response.data) {
          setContentStatus(response.data.status || null);
          setContentRecordId(response.data.id || null);
        } else {
          setContentStatus(null);
          setContentRecordId(null);
        }
      } catch (_err: any) {
        toast.error('Failed to fetch content status.');
      }
    };

    fetchStatus();
  }, [book?.id]);

  useEffect(() => {
    if (!socket || !id || !book) return;

    const handleBookEnriched = (enrichedBook: any) => {
      // Filter based on _id, googleBooksId, or openLibraryId
      if (
        enrichedBook._id === book.id ||
        enrichedBook.googleBooksId === book.googleBooksId ||
        (enrichedBook.openLibraryId &&
          enrichedBook.openLibraryId === book.openLibraryId)
      ) {
        console.log('Received matching enriched book data:', enrichedBook);
        setBook(normalizeBookData(enrichedBook));
        toast.success('Book details updated with enriched data!');
      }
    };

    socket.on('bookEnriched', handleBookEnriched);

    return () => {
      socket.off('bookEnriched', handleBookEnriched);
    };
  }, [socket, id, book?.id, book?.googleBooksId, book?.openLibraryId]);
  const updateStatus = async (newStatus: string) => {
    if (!book) return;
    if (newStatus === 'add-to-list') return;
    try {
      let response;
      if (contentRecordId) {
        response = await ContentListService.updateContentStatus(
          contentRecordId,
          {
            status: newStatus,
          }
        );
        if (response.success) {
          setContentStatus(newStatus);
          toast.success('Content status updated successfully.');
        } else {
          throw new Error(
            response.message || 'Failed to update content status.'
          );
        }
      } else {
        response = await ContentListService.addContent({
          content: { id: book.id, type: 'Book' },
          status: newStatus,
          suggestionId: undefined,
        });
        if (response.success && response.data) {
          setContentStatus(newStatus);
          setContentRecordId(response.data.id);
          toast.success('Content added successfully.');
        } else {
          throw new Error(response.message || 'Failed to add content.');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsPopoverOpen(false);
    }
  };

  const handleAuthDialogClose = useCallback(
    (success: boolean = false) => {
      if (success) {
        updateStatus(newStatus || '');
      } else {
        toast.error('Failed : Login first to change status');
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
    if (status === 'Consumed') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    } else if (status === 'Consuming') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    } else if (status === 'WantToConsume') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    } else if (status === 'NotInterested') {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusOptions = () => {
    const baseOptions = [
      { value: 'Consumed', label: 'Finished' },
      { value: 'Consuming', label: 'Reading' },
      { value: 'WantToConsume', label: 'Reading List' },
      { value: 'NotInterested', label: 'Not Interested' },
    ];
    if (!contentRecordId) {
      return [
        { value: 'add-to-list', label: 'Add to Your List' },
        ...baseOptions,
      ];
    }
    return baseOptions;
  };

  const getContentSpecificStatusLabel = (status: string | null): string => {
    if (!status) return 'Add to Your List';
    if (status === 'NotInterested') return 'Not Interested';
    if (status === 'WantToConsume') return 'Reading List';
    return status === 'Consumed' ? 'Finished' : 'Reading';
  };

  if (loading) {
    return (
      <main className='mx-auto w-full px-4 pt-0 sm:px-6 lg:px-8'>
        <div className='py-6'>
          <Button
            variant='ghost'
            className='mb-4'
            onClick={() => navigate({ to: '..' })}
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>
          <div className='py-12 text-center'>
            <h2 className='text-2xl font-bold'>Loading...</h2>
          </div>
        </div>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className='mx-auto w-full px-4 pt-0 sm:px-6 lg:px-8'>
        <div className='py-6'>
          <Button
            variant='ghost'
            className='mb-4'
            onClick={() => navigate({ to: '..' })}
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>
          <div className='py-12 text-center'>
            <h2 className='text-2xl font-bold'>Book Not Found</h2>
            <p className='text-muted-foreground mt-2'>
              {error ||
                'The book you are looking for does not exist or could not be loaded.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='mx-auto w-full px-4 pt-0 pb-[10vh] sm:px-6 lg:px-8'>
      <div className='py-6'>
        <Button
          variant='ghost'
          className='mb-4'
          onClick={() => navigate({ to: '..' })}
        >
          <ArrowLeft className='mr-2 h-4 w-4' /> Back
        </Button>

        <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
          <div className='md:col-span-1'>
            <div className='bg-muted overflow-hidden rounded-lg shadow-lg'>
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className='h-auto w-full object-cover'
                />
              ) : (
                <div className='bg-primary/10 flex h-64 w-full items-center justify-center'>
                  <BookOpen className='text-primary/60 h-12 w-12' />
                </div>
              )}
            </div>

            <div className='bg-card mt-6 rounded-lg p-4 shadow-sm'>
              <h3 className='mb-3 text-lg font-medium'>Where to Read</h3>
              <div className='space-y-2'>
                {book.whereToRead?.length ? (
                  book.whereToRead.map((place, index) => (
                    <a
                      key={index}
                      href='#'
                      className='hover:bg-accent flex items-center justify-between rounded-md p-2 transition-colors'
                    >
                      <span>{place}</span>
                      <ExternalLink className='text-muted-foreground h-4 w-4' />
                    </a>
                  ))
                ) : (
                  <p className='text-muted-foreground text-sm'>Not available</p>
                )}
              </div>
            </div>
          </div>

          <div className='md:col-span-2'>
            <div className='mb-2 flex items-center gap-2'>
              <div className='bg-primary/10 dark:bg-primary/20 rounded-full p-1.5'>
                <BookOpen className='h-5 w-5' />
              </div>
              <span className='text-primary text-sm font-medium'>Book</span>
              {book.publishedYear && (
                <span className='text-muted-foreground text-sm'>
                  ({book.publishedYear})
                </span>
              )}
            </div>

            <div className='mb-2 flex items-center gap-4'>
              <h1 className='text-3xl font-bold'>{book.title}</h1>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeColor(
                      contentStatus
                    )} transition-opacity hover:opacity-80`}
                    aria-label='Change content status'
                  >
                    {contentStatus === 'Consumed' ? (
                      <CheckCircle className='mr-1 h-4 w-4' />
                    ) : contentStatus === 'Consuming' ? (
                      <Clock className='mr-1 h-4 w-4' />
                    ) : contentStatus === 'WantToConsume' ? (
                      <Bookmark className='mr-1 h-4 w-4' />
                    ) : contentStatus === 'NotInterested' ? (
                      <XCircle className='mr-1 h-4 w-4' />
                    ) : (
                      <Bookmark className='mr-1 h-4 w-4' />
                    )}
                    {getContentSpecificStatusLabel(contentStatus)}
                    <ChevronDown className='ml-2 h-4 w-4' />
                  </button>
                </PopoverTrigger>
                <PopoverContent className='w-48 p-2'>
                  <div className='space-y-1'>
                    {getStatusOptions().map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                          option.value === contentStatus
                            ? 'bg-primary/10 text-foreground cursor-not-allowed'
                            : 'hover:bg-accent'
                        } disabled:opacity-50`}
                        disabled={
                          option.value === 'add-to-list' ||
                          option.value === contentStatus
                        }
                      >
                        {option.value === 'add-to-list' ? (
                          <Bookmark className='h-4 w-4' />
                        ) : option.value === 'Consumed' ? (
                          <CheckCircle className='h-4 w-4' />
                        ) : option.value === 'Consuming' ? (
                          <Clock className='h-4 w-4' />
                        ) : option.value === 'WantToConsume' ? (
                          <Bookmark className='h-4 w-4' />
                        ) : (
                          <XCircle className='h-4 w-4' />
                        )}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {book.subtitle && (
              <h2 className='text-muted-foreground mb-3 text-xl'>
                {book.subtitle}
              </h2>
            )}

            <p className='text-muted-foreground mb-4'>
              {[
                book.authors && (
                  <span className='font-medium'>By {book.authors}</span>
                ),
                typeof book.publisher === 'string'
                  ? book.publisher
                  : book.publisher?.name,
                book.isbn && `ISBN: ${book.isbn}`,
                book.pages && `${book.pages} pages`,
                book.language && `Language: ${book.language.toUpperCase()}`,
              ]
                .filter(Boolean)
                .map((item, index) => (
                  <Fragment key={index}>
                    {index > 0 && ' • '}
                    {item}
                  </Fragment>
                ))}
            </p>

            {book.genres && book.genres.length > 0 && (
              <div className='mb-4'>
                <h3 className='text-lg font-medium'>Genres</h3>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {book.genres.map((genre, index) => (
                    <span
                      key={index}
                      className='bg-accent rounded-full px-3 py-1 text-sm'
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {book.awards &&
              (book.awards.wins > 0 || book.awards.nominations > 0) && (
                <div className='mb-4'>
                  <h3 className='text-lg font-medium'>Awards</h3>
                  <div className='mt-2'>
                    <p>
                      {book.awards.wins} wins, {book.awards.nominations}{' '}
                      nominations
                    </p>
                    {book.awards.awardsDetails?.length > 0 && (
                      <ul className='mt-2 list-disc pl-5'>
                        {book.awards.awardsDetails.map((award, index) => (
                          <li key={index}>{award}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

            <div className='mb-6'>
              <h2 className='mb-2 text-xl font-semibold'>Description</h2>
              <p
                className='text-foreground'
                dangerouslySetInnerHTML={{
                  __html: book.description || 'No description available.',
                }}
              ></p>
            </div>

            <div className='mb-6 flex items-center gap-4'>
              <Button
                variant='outline'
                size='sm'
                className='gap-2 rounded-full'
              >
                <Heart className='h-4 w-4' /> Like
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='gap-2 rounded-full'
              >
                <MessageCircle className='h-4 w-4' /> Comment
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='gap-2 rounded-full'
              >
                <Share2 className='h-4 w-4' /> Share
              </Button>
            </div>

            <Separator className='my-6' />

            {book.suggestedBy && (
              <div className='mb-6'>
                <h2 className='mb-3 text-lg font-semibold'>Suggested by</h2>
                <div className='flex items-center'>
                  <Avatar className='ring-primary/20 mr-3 h-10 w-10 ring-2'>
                    <AvatarImage
                      src={book.suggestedBy.avatar}
                      alt={book.suggestedBy.name}
                    />
                    <AvatarFallback>
                      {book.suggestedBy.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>{book.suggestedBy.name}</p>
                    {book.suggestedAt && (
                      <p className='text-muted-foreground text-sm'>
                        {new Date(book.suggestedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {book.suggestedTo && book.suggestedTo.length > 0 && (
              <div>
                <h2 className='mb-3 text-lg font-semibold'>Suggested to</h2>
                <div className='flex flex-wrap gap-2'>
                  {book.suggestedTo.map((recipient) => (
                    <div
                      key={recipient.id}
                      className='bg-accent hover:bg-accent/80 flex items-center rounded-full px-3 py-1 transition-colors'
                    >
                      <Avatar className='ring-primary/20 mr-2 h-6 w-6 ring-1'>
                        <AvatarImage
                          src={recipient.avatar}
                          alt={recipient.name}
                        />
                        <AvatarFallback>
                          {recipient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className='text-sm font-medium'>
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
      <AuthDialog isOpen={isAuthDialogOpen} onClose={handleAuthDialogClose} />
    </main>
  );
};

export default BookDetailsPage;

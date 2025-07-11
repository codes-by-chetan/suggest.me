import type React from 'react';
import { useState, useEffect, useRef, RefObject } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  GlobalSearchResults,
  PeopleSearchResult,
} from '@/interfaces/api/search.interface';
import { globalSearch, searchPeople } from '@/services/search.service';
import { Bell, Search, Check, Menu, X, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { useDebounce } from '@/hooks/use-debounce';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import AppName from '../tags/AppName';
import NotificationItem from './NotificationItem';
import SearchResultsPopup from './SearchResultsPopup';
import { ThemeToggle } from '../reusables/theme-toggle';

const _initialGlobalResultsState = {
  movie: {
    data: [],
    total: 0,
  },
  series: {
    data: [],
    total: 0,
  },
  book: {
    data: [],
    total: 0,
  },
  music: {
    data: [],
    total: 0,
  },
  songs: {
    data: [],
    total: 0,
  },
  album: {
    data: [],
    total: 0,
  },
  video: {
    data: [],
    total: 0,
  },
  people: {
    data: [],
    total: 0,
  },
};

// Hook to detect clicks outside a ref
const useOutsideClick = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalResults, setGlobalResults] =
    useState<GlobalSearchResults | null>(null);
  const [peopleResults, setPeopleResults] = useState<PeopleSearchResult | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const navigate = useNavigate();
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  // Close search popup on outside click
  useOutsideClick(desktopSearchRef as RefObject<HTMLElement>, () =>
    setDesktopSearchOpen(false)
  );
  useOutsideClick(mobileSearchRef as RefObject<HTMLElement>, () =>
    setMobileSearchOpen(false)
  );

  useEffect(() => {
    const closePopups = () => {
      setDesktopSearchOpen(false);
      setMobileSearchOpen(false);
    };
    document.addEventListener('closeSearchPopups', closePopups);
    return () => {
      document.removeEventListener('closeSearchPopups', closePopups);
    };
  }, []);

  // Debounced search function
  const performSearch = async (term: string) => {
    if (term.trim().length < 1) {
      setGlobalResults(null);
      setPeopleResults(null);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setDesktopSearchOpen(true); // Open popup for desktop
      setMobileSearchOpen(true); // Open popup for mobile
      const [global, people] = await Promise.all([
        globalSearch({ searchTerm: term }),
        searchPeople({ searchTerm: term }),
      ]);
      if (global.data) setGlobalResults(global.data.results);

      if (people.data) setPeopleResults(people.data);
    } catch (error) {
      console.error('Search error:', error);
      setGlobalResults(null);
      setPeopleResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input changes
  useEffect(() => {
    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate({ to: '/sign-in' });
  };

  // Handle input focus to ensure typing and open popup
  const handleInputFocus = (isDesktop: boolean) => {
    if (isDesktop) {
      desktopInputRef.current?.focus();
      setDesktopSearchOpen(searchTerm.length > 0 ? true : false);
    } else {
      mobileInputRef.current?.focus();
      setMobileSearchOpen(searchTerm.length > 0 ? true : false);
    }
  };

  return (
    <nav className='bg-card dark:bg-card border-border shadow-social dark:shadow-social-dark relative top-0 right-0 z-20 w-full border-b'>
      <div className='mx-auto max-w-full px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 justify-between'>
          {/* Logo */}
          <div className='flex md:ml-16'>
            <div className='flex flex-shrink-0 items-center justify-center gap-2'>
              <img
                src='/suggestMeLogo.png'
                alt='Light Theme Logo'
                className='hidden h-7 w-7 dark:block'
              />
              <img
                src='/suggestMeLogoDark.png'
                alt='Dark Theme Logo'
                className='block h-7 w-7 dark:hidden'
              />
              <AppName />
            </div>
          </div>

          {/* Search bar - desktop only */}
          <div className='mx-4 hidden max-w-xs flex-1 items-center md:flex'>
            <div ref={desktopSearchRef} className='relative w-full'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                <Search className='text-muted-foreground h-4 w-4' />
              </div>
              <input
                ref={desktopInputRef}
                type='text'
                placeholder='Search people, movies, books, ...'
                className='bg-accent/50 ring-primary/30 focus:ring-primary/70 w-full rounded-full border-0 py-1.5 pr-4 pl-10 text-sm ring-1 focus:ring-1 focus:outline-none'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => handleInputFocus(true)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleInputFocus(true);
                }}
              />
              {desktopSearchOpen && (
                <div className='absolute top-full left-0 z-[1000] mt-2 w-full'>
                  <SearchResultsPopup
                    globalResults={globalResults}
                    peopleResults={peopleResults}
                    isSearching={isSearching}
                    searchTerm={searchTerm}
                  />
                </div>
              )}
            </div>
          </div>

          {/* User profile dropdown and suggest button */}
          <div className='hidden sm:flex sm:items-center sm:space-x-3'>
            {/* Notification bell */}
            {isAuthenticated && (
              <DropdownMenu
                open={notificationsOpen}
                onOpenChange={setNotificationsOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='relative rounded-full'
                  >
                    <Bell className='h-5 w-5' />
                    {unreadCount > 0 && (
                      <span className='bg-primary ring-card absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white ring-2'>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-80 p-0'>
                  <div className='flex items-center justify-between p-3'>
                    <DropdownMenuLabel className='p-0'>
                      Notifications
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='flex h-8 items-center gap-1 text-xs'
                        onClick={markAllAsRead}
                      >
                        <Check className='h-3 w-3' />
                        Mark all as read
                      </Button>
                    )}
                  </div>
                  <Separator />
                  <ScrollArea className='h-[300px]'>
                    {notifications.length > 0 ? (
                      notifications
                        .slice(0, 5) // Show only the latest 5 notifications
                        .map((notification) => (
                          <NotificationItem
                            key={notification._id}
                            notification={{
                              id: notification._id,
                              type: notification.type,
                              title:
                                notification.type === 'Suggestion'
                                  ? 'New Suggestion'
                                  : notification.type === 'Like'
                                    ? 'New Like'
                                    : notification.type === 'Comment'
                                      ? 'New Comment'
                                      : notification.type === 'System'
                                        ? 'System Notification'
                                        : notification.type === 'FollowRequest'
                                          ? 'Follow Request'
                                          : notification.type ===
                                              'FollowAccepted'
                                            ? 'Follow Accepted'
                                            : notification.type ===
                                                'FollowedYou'
                                              ? 'Followed You'
                                              : notification.type ===
                                                  'NewContent'
                                                ? 'New Content'
                                                : notification.type ===
                                                    'Mention'
                                                  ? 'Mention'
                                                  : 'Notification',
                              message: notification.message,
                              timestamp: notification.createdAt,
                              read: notification.status === 'Read',
                              contentType:
                                notification.relatedContent?.contentType,
                              user: notification.sender
                                ? {
                                    id: notification.sender._id,
                                    fullName: notification.sender.fullName,
                                    fullNameString:
                                      notification.sender.fullNameString ||
                                      `${notification.sender.fullName.firstName} ${notification.sender.fullName.lastName}`,
                                    avatar:
                                      notification.sender.avatar?.url ||
                                      notification.sender?.profile?.avatar
                                        ?.url ||
                                      null,
                                    profile: notification.sender.profile || {},
                                  }
                                : undefined,
                            }}
                            onMarkAsRead={() => {
                              markAsRead(notification._id);
                              setNotificationsOpen(false);
                            }}
                            closePopup={() => setNotificationsOpen(false)}
                          />
                        ))
                    ) : (
                      <div className='text-muted-foreground p-4 text-center text-sm'>
                        No notifications yet
                      </div>
                    )}
                  </ScrollArea>
                  <Separator />
                  <div className='p-3'>
                    <Button
                      variant='default'
                      size='sm'
                      className='w-full text-xs'
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate({to: '/notifications'});
                      }}
                    >
                      View All Notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <ThemeToggle />

            {/* <Button variant="default" size="sm" className="rounded-full px-4">
              Suggest
            </Button> */}

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='ring-primary/20 hover:ring-primary/30 relative h-9 w-9 rounded-full ring-2 transition-all'
                  >
                    <Avatar className='h-9 w-9'>
                      {user?.avatar ? (
                        <AvatarImage
                          src={user.avatar.url || '/placeholder.svg'}
                          alt={user.fullNameString}
                        />
                      ) : (
                        <AvatarFallback className='bg-primary-100 text-primary-800'>
                          {user.fullName.firstName.charAt(0)}
                          {user.fullName.lastName.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuLabel>{user.fullNameString}</DropdownMenuLabel>
                  <DropdownMenuLabel className='text-muted-foreground text-xs'>
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to='/profile' className='w-full cursor-pointer'>
                      <User className='mr-2 h-4 w-4' />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className='text-destructive focus:text-destructive cursor-pointer'
                  >
                    <LogOut className='mr-2 h-4 w-4' />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='rounded-full'
                  asChild
                >
                  <Link to='/login'>Login</Link>
                </Button>
                <Button size='sm' className='rounded-full' asChild>
                  <Link to='/signup'>Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className='flex items-center sm:hidden'>
            <Button
              variant='ghost'
              size='icon'
              className='rounded-full'
              onClick={toggleMenu}
            >
              <span className='sr-only'>Open main menu</span>
              {isMenuOpen ? (
                <X className='h-5 w-5' aria-hidden='true' />
              ) : (
                <Menu className='h-5 w-5' aria-hidden='true' />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={cn('sm:hidden', isMenuOpen ? 'block' : 'hidden')}>
        {/* Mobile search */}
        <div className='px-4 pt-2 pb-3'>
          <div ref={mobileSearchRef} className='relative'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <Search className='text-muted-foreground h-4 w-4' />
            </div>
            <input
              ref={mobileInputRef}
              type='text'
              placeholder='Search suggestions...'
              className='bg-accent/50 focus:ring-primary/30 w-full rounded-full border-0 py-2 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => handleInputFocus(false)}
              onClick={(e) => {
                e.stopPropagation();
                handleInputFocus(false);
              }}
            />
            {mobileSearchOpen && (
              <div className='absolute top-full left-0 z-[1000] mt-2 w-full'>
                <SearchResultsPopup
                  globalResults={globalResults}
                  peopleResults={peopleResults}
                  isSearching={isSearching}
                  searchTerm={searchTerm}
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile login/signup buttons */}
        {!isAuthenticated && (
          <div className='border-border border-t pt-4 pb-3'>
            <div className='flex flex-col space-y-2 px-4'>
              <Button variant='outline' className='rounded-full' asChild>
                <Link to='/login'>Login</Link>
              </Button>
              <Button className='rounded-full' asChild>
                <Link to='/signup'>Sign Up</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Mobile suggest button */}
        <div className='border-border border-t p-4'>
          <Button className='w-full rounded-full' variant='default'>
            Suggest
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

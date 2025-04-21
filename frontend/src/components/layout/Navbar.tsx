import { useState, useEffect } from 'react'
import { useEffect as useReactEffect } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import {
  Home,
  User,
  BookMarked,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Check,
  BookOpenCheck,
  Link,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import NotificationItem, { Notification } from './NotificationItem'
import AppName from './AppName'
import { ThemeSwitch } from '../theme-switch'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // Get auth context
  const auth = useAuthStore().auth
  // Create state variables that will trigger re-renders when they change
  const [currentUser, setCurrentUser] = useState(auth.user)
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(
    auth.user ? true : false
  )

  const navigate = useNavigate()
  const location = useLocation()

  // Update local state when auth context changes
  useReactEffect(() => {
    setCurrentUser(auth.user)
    setIsUserAuthenticated(auth.user ? true : false)
  }, [auth.user])

  // Mock notifications data
  useEffect(() => {
    // In a real app, this would be fetched from an API
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'suggestion',
        title: 'New Suggestion',
        message: "Emma Watson suggested 'Inception' to you",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        read: false,
        contentType: 'movie',
        user: {
          id: '1',
          name: 'Emma Watson',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
        },
      },
      {
        id: '2',
        type: 'suggestion',
        title: 'New Suggestion',
        message: "John Smith suggested 'To Kill a Mockingbird' to you",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        read: false,
        contentType: 'book',
        user: {
          id: '2',
          name: 'John Smith',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
        },
      },
      {
        id: '3',
        type: 'like',
        title: 'New Like',
        message: "Sophia Chen liked your suggestion 'Attack on Titan'",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        read: true,
        contentType: 'anime',
        user: {
          id: '3',
          name: 'Sophia Chen',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophia',
        },
      },
      {
        id: '4',
        type: 'comment',
        title: 'New Comment',
        message:
          "Michael Johnson commented on your suggestion 'Bohemian Rhapsody': 'Great song! I love Queen.'",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        read: true,
        contentType: 'song',
        user: {
          id: '4',
          name: 'Michael Johnson',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
        },
      },
      {
        id: '5',
        type: 'system',
        title: 'Welcome to Suggest.me',
        message:
          'Thanks for joining! Start by suggesting content to your friends or exploring suggestions made to you.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        read: true,
      },
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter((n) => !n.read).length)
  }, [])

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Logout function
  const handleLogout = () => {
    auth.reset()
    navigate({ to:"/sign-in-2"})
  }

  // Check if the current path matches the link path
  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className='bg-card dark:bg-card border-border shadow-social dark:shadow-social-dark fixed top-0 left-0 z-50 w-full border-b'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 justify-between'>
          {/* Logo and desktop navigation */}
          <div className='flex'>
            <div className='flex flex-shrink-0 items-center'>
              <AppName />
            </div>
            <div className='hidden sm:ml-6 sm:flex sm:space-x-1'>
              <Link
                to='/'
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium transition-colors',
                  isActive('/')
                    ? 'bg-primary-100 text-primary dark:bg-primary-900 dark:text-primary-300'
                    : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                )}
              >
                <Home className='mr-2 h-4 w-4' />
                Home
              </Link>
              <Link
                to='/suggested-to-me'
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium transition-colors',
                  isActive('/suggested-to-me')
                    ? 'bg-primary-100 text-primary dark:bg-primary-900 dark:text-primary-300'
                    : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                )}
              >
                <BookOpenCheck className='mr-2 h-4 w-4' />
                Suggested to Me
              </Link>
              <Link
                to='/my-suggestions'
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium transition-colors',
                  isActive('/my-suggestions')
                    ? 'bg-primary-100 text-primary dark:bg-primary-900 dark:text-primary-300'
                    : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                )}
              >
                <User className='mr-2 h-4 w-4' />
                My Suggestions
              </Link>
              <Link
                to='/my-watchlist'
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium transition-colors',
                  isActive('/my-watchlist')
                    ? 'bg-primary-100 text-primary dark:bg-primary-900 dark:text-primary-300'
                    : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                )}
              >
                <BookMarked className='mr-2 h-4 w-4' />
                My Watchlist
              </Link>
            </div>
          </div>

          {/* Search bar - desktop only */}
          <div className='mx-4 hidden max-w-xs flex-1 items-center md:flex'>
            <div className='relative w-full'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                <Search className='text-muted-foreground h-4 w-4' />
              </div>
              <input
                type='text'
                placeholder='Search suggestions...'
                className='bg-accent/50 ring-primary/30 focus:ring-primary/70 w-full rounded-full border-0 py-1.5 pr-4 pl-10 text-sm ring-1 focus:ring-1 focus:outline-none'
              />
            </div>
          </div>

          {/* User profile dropdown and suggest button */}
          <div className='hidden sm:flex sm:items-center sm:space-x-3'>
            {/* Notification bell */}
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
                      onClick={handleMarkAllAsRead}
                    >
                      <Check className='h-3 w-3' /> Mark all as read
                    </Button>
                  )}
                </div>
                <Separator />
                <ScrollArea className='h-[300px]'>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                      />
                    ))
                  ) : (
                    <div className='text-muted-foreground p-4 text-center text-sm'>
                      No notifications yet
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeSwitch />

            <Button variant='default' size='sm' className='rounded-full px-4'>
              Suggest
            </Button>

            {isUserAuthenticated && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='ring-primary/20 hover:ring-primary/30 relative h-9 w-9 rounded-full ring-2 transition-all'
                  >
                    <Avatar className='h-9 w-9'>
                      <AvatarImage
                        src={currentUser.avatar}
                        alt={currentUser.name}
                      />
                      <AvatarFallback className='bg-primary-100 text-primary-800'>
                        {currentUser.name ? currentUser.name.charAt(0): ""}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuLabel>{currentUser.name}</DropdownMenuLabel>
                  <DropdownMenuLabel className='text-muted-foreground text-xs'>
                    {currentUser.email}
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
          <div className='relative'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <Search className='text-muted-foreground h-4 w-4' />
            </div>
            <input
              type='text'
              placeholder='Search suggestions...'
              className='bg-accent/50 focus:ring-primary/30 w-full rounded-full border-0 py-2 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none'
            />
          </div>
        </div>

        <div className='space-y-1 px-4 pt-2 pb-3'>
          <Link
            to='/'
            className={cn(
              'block px-3 py-2 text-base font-medium',
              isActive('/')
                ? 'bg-primary-50 text-primary dark:bg-primary-900 dark:text-primary-300'
                : 'text-foreground/70 hover:bg-accent hover:text-foreground'
            )}
          >
            <Home className='mr-2 inline-block h-5 w-5' />
            Home
          </Link>
          <Link
            to='/suggested-to-me'
            className={cn(
              'block px-3 py-2 text-base font-medium',
              isActive('/suggested-to-me')
                ? 'bg-primary-50 text-primary dark:bg-primary-900 dark:text-primary-300'
                : 'text-foreground/70 hover:bg-accent hover:text-foreground'
            )}
          >
            <BookMarked className='mr-2 inline-block h-5 w-5' />
            Suggested to Me
          </Link>
          <Link
            to='/my-suggestions'
            className={cn(
              'block px-3 py-2 text-base font-medium',
              isActive('/my-suggestions')
                ? 'bg-primary-50 text-primary dark:bg-primary-900 dark:text-primary-300'
                : 'text-foreground/70 hover:bg-accent hover:text-foreground'
            )}
          >
            <User className='mr-2 inline-block h-5 w-5' />
            My Suggestions
          </Link>
          <Link
            to='/my-watchlist'
            className={cn(
              'block px-3 py-2 text-base font-medium',
              isActive('/my-watchlist')
                ? 'bg-primary-50 text-primary dark:bg-primary-900 dark:text-primary-300'
                : 'text-foreground/70 hover:bg-accent hover:text-foreground'
            )}
          >
            <BookMarked className='mr-2 inline-block h-5 w-5' />
            My Watchlist
          </Link>
        </div>

        {/* Mobile profile section */}
        {isUserAuthenticated && currentUser ? (
          <div className='border-border border-t pt-4 pb-3'>
            <div className='flex items-center px-4'>
              <div className='flex-shrink-0'>
                <Avatar className='ring-primary/20 h-10 w-10 ring-2'>
                  <AvatarImage
                    src={currentUser.avatar}
                    alt={currentUser.name}
                  />
                  <AvatarFallback className='bg-primary-100 text-primary-800'>
                  {currentUser.name ? currentUser.name.charAt(0): ""}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className='ml-3'>
                <div className='text-base font-medium'>{currentUser.name}</div>
                <div className='text-muted-foreground text-sm font-medium'>
                  {currentUser.email}
                </div>
              </div>
              <div className='ml-auto'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='relative rounded-full'
                  onClick={() => setNotificationsOpen(true)}
                >
                  <Bell className='h-5 w-5' />
                  {unreadCount > 0 && (
                    <span className='bg-primary ring-card absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white ring-2'>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
            <div className='mt-3 space-y-1 px-4'>
              <Link
                to='/profile'
                className='text-foreground/70 hover:bg-accent hover:text-foreground block rounded-md px-3 py-2 text-base font-medium'
              >
                <User className='mr-2 inline-block h-5 w-5' />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className='text-destructive hover:bg-destructive/10 block w-full rounded-md px-3 py-2 text-left text-base font-medium'
              >
                <LogOut className='mr-2 inline-block h-5 w-5' />
                Logout
              </button>
            </div>
          </div>
        ) : (
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
  )
}

export default Navbar

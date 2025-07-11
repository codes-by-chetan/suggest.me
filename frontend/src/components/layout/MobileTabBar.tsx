import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Home, User, Search, Library, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useAuthDialog } from '@/context/auth-dialog-context';
import { useNotifications } from '@/context/notification-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mobile tab bar
const MobileTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const { hideAuthDialog, showAuthDialog } = useAuthDialog();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const contentPaths = ['/my-watchlist', '/suggested-to-me', '/my-suggestions'];

  const isActive = (path: string) => {
    if (path === '/chat') {
      return (
        location.pathname === path || location.pathname.startsWith('/chat/')
      );
    }
    if (path === '/profile') {
      return (
        location.pathname === path ||
        location.pathname.startsWith('/profile/') ||
        location.pathname === '/edit-profile'
      );
    }
    return location.pathname === path;
  };

  const isContentTabActive = contentPaths.some((path) => isActive(path));

  const handleNavigation = (path: string, isProtected = false) => {
    // Close any open auth dialog when navigating
    hideAuthDialog();

    // If route is protected and user is not authenticated, show auth dialog
    if (isProtected && !isAuthenticated) {
      showAuthDialog(path, 'login', true, location.pathname);
      return;
    }

    navigate({ to: path });
  };

  const handleContentClick = () => {
    if (isAuthenticated) {
      setIsDialogOpen(true);
    } else {
      // Show auth dialog for protected content
      showAuthDialog('/my-watchlist', 'login', true, location.pathname);
    }
  };

  const handleContentNavigation = (path: string) => {
    setIsDialogOpen(false);
    handleNavigation(path, true);
  };

  return (
    <div className='bg-card border-border absolute !right-0 !bottom-0 !left-0 z-[10000] border-t md:hidden'>
      <div className='flex h-[10vh] items-center justify-around'>
        <button
          onClick={() => handleNavigation('/')}
          className={cn(
            'flex flex-1 flex-col items-center justify-center py-2',
            isActive('/')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Home className='h-5 w-5' />
          <span className='mt-1 text-xs'>Home</span>
        </button>

        {/* Content Tab */}
        {isAuthenticated ? (
          <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Dialog.Trigger asChild>
              <button
                className={cn(
                  'flex flex-1 flex-col items-center justify-center py-2',
                  isContentTabActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Library className='h-5 w-5' />
                <span className='mt-1 text-xs'>Content</span>
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className='fixed inset-0 z-50 bg-black/50' />
              <Dialog.Content className='bg-card border-border fixed bottom-16 left-1/2 z-50 w-40 -translate-x-1/2 transform rounded-md border p-2'>
                <Dialog.Title className='mb-2 text-sm font-semibold'>
                  Select Content
                </Dialog.Title>
                <div className='flex flex-col gap-1'>
                  <button
                    onClick={() => handleContentNavigation('/my-watchlist')}
                    className={cn(
                      'rounded-md p-1 text-center text-sm',
                      isActive('/my-watchlist')
                        ? 'bg-primary text-primary-foreground cursor-not-allowed'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    Watchlist
                  </button>
                  <button
                    onClick={() => handleContentNavigation('/suggested-to-me')}
                    className={cn(
                      'rounded-md p-1 text-center text-sm',
                      isActive('/suggested-to-me')
                        ? 'bg-primary text-primary-foreground cursor-not-allowed'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    Suggested
                  </button>
                  <button
                    onClick={() => handleContentNavigation('/my-suggestions')}
                    className={cn(
                      'rounded-md p-1 text-center text-sm',
                      isActive('/my-suggestions')
                        ? 'bg-primary text-primary-foreground cursor-not-allowed'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    My Suggestions
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        ) : (
          <button
            onClick={handleContentClick}
            className={cn(
              'flex flex-1 flex-col items-center justify-center py-2',
              isContentTabActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Library className='h-5 w-5' />
            <span className='mt-1 text-xs'>Content</span>
          </button>
        )}

        <button
          onClick={() => handleNavigation('/search')}
          className={cn(
            'flex flex-1 flex-col items-center justify-center py-2',
            isActive('/search')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Search className='h-5 w-5' />
          <span className='mt-1 text-xs'>Search</span>
        </button>

        {/* Notifications Tab */}
        <button
          onClick={() => handleNavigation('/notifications', true)}
          className={cn(
            'relative flex flex-1 flex-col items-center justify-center py-2',
            isActive('/notifications')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Bell className='h-5 w-5' />
          {isAuthenticated && unreadCount > 0 && (
            <span className='bg-primary ring-card absolute top-1 right-1/3 flex h-4 w-4 translate-x-2 items-center justify-center rounded-full text-[10px] font-medium text-white ring-1'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className='mt-1 text-xs'>Alerts</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => handleNavigation('/profile', true)}
          className={cn(
            'flex flex-1 flex-col items-center justify-center py-2',
            isActive('/profile')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {isAuthenticated && user ? (
            <Avatar className='h-6 w-6'>
              {user?.avatar ? (
                <AvatarImage
                  src={user.avatar.url || '/placeholder.svg'}
                  alt={user.fullNameString}
                />
              ) : (
                <AvatarFallback className='bg-primary-100 text-primary-800 text-xs'>
                  {user.fullName.firstName.charAt(0)}
                  {user.fullName.lastName.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
          ) : (
            <div className='bg-muted border-muted-foreground/30 flex h-6 w-6 items-center justify-center rounded-full border-2'>
              <User className='text-muted-foreground h-3 w-3' />
            </div>
          )}
          <span className='mt-1 text-xs'>Profile</span>
        </button>
      </div>
    </div>
  );
};

export default MobileTabBar;

import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { AuthProvider } from '@/context/auth-context';
import { AuthDialogProvider } from '@/context/auth-dialog-context';
import { NotificationProvider } from '@/context/notification-context';
import { SocketProvider } from '@/context/socket-context';
import { Toaster } from '@/components/ui/sonner';
import MobileTabBar from '@/components/layout/MobileTabBar';
import { NavigationProgress } from '@/components/navigation-progress';
import GeneralError from '@/features/errors/general-error';
import NotFoundError from '@/features/errors/not-found-error';
import { GlobalAuthDialog } from '@/components/auth/GlobalAuthDialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: () => {
    return (
      <>
        <NavigationProgress />
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <AuthDialogProvider>
                <GlobalAuthDialog />
                <ScrollArea>
                  <Outlet />
                </ScrollArea>
                <MobileTabBar />
              </AuthDialogProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
        <Toaster duration={50000} />
      </>
    );
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
});

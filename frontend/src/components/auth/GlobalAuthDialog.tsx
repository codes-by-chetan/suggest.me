import type React from 'react';
import { DialogTitle } from '@radix-ui/react-dialog';
import { useNavigate } from '@tanstack/react-router';
import { isProtectedRoute } from '@/config/route-config';
import { useAuth } from '@/context/auth-context';
import { useAuthDialog } from '@/context/auth-dialog-context';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AuthTab } from '../layout/AuthTab';

export const GlobalAuthDialog: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { authDialog, hideAuthDialog } = useAuthDialog();
  const navigate = useNavigate();

  const findSafeRoute = (targetRoute: string): string => {
    // If target route is not protected, it's safe
    if (!isProtectedRoute(targetRoute)) {
      return targetRoute;
    }

    // If target route is protected, return home
    return '/';
  };

  const handleClose = (success = false) => {
    if (success && isAuthenticated) {
      // If authentication was successful, navigate to the intended route
      navigate({ to: authDialog.redirectTo });
    } else if (authDialog.isProtectedRoute && !isAuthenticated) {
      // For protected routes, navigate to a safe route
      const safeRoute = findSafeRoute(authDialog.previousRoute || '/');
      navigate({ to: safeRoute });
    }
    // For unprotected routes, user stays on current page (no navigation needed)

    hideAuthDialog();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={authDialog.isOpen} onOpenChange={handleOpenChange}>
      <DialogTitle className='sr-only'>Authentication Required</DialogTitle>
      <DialogContent
        className='max-h-[95vh] gap-0 overflow-hidden p-0 sm:max-w-md [&>button]:hidden'
        onEscapeKeyDown={() => handleClose()}
        onPointerDownOutside={() => handleClose()}
      >
        <AuthTab
          onClose={handleClose}
          defaultTab={authDialog.defaultTab}
          isOpen={authDialog.isOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

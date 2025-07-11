import { toast as shadcnToast } from 'sonner';

// type ToastType = 'success' | 'error' | 'info' | 'warning' | 'notification';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationToastOptions extends ToastOptions {
  onClick?: () => void;
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return shadcnToast.success(message, {
      description: options?.description,
      duration: options?.duration || 3000,
      action: options?.action,
      className: 'toast-success bg-green-100 text-green-800 border-green-300',
      style: { borderRadius: '8px', padding: '12px', fontFamily: 'Inter, sans-serif' },
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return shadcnToast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
      className: 'toast-error bg-red-100 text-red-800 border-red-300',
      style: { borderRadius: '8px', padding: '12px', fontFamily: 'Inter, sans-serif' },
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return shadcnToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      className: 'toast-info bg-blue-100 text-blue-800 border-blue-300',
      style: { borderRadius: '8px', padding: '12px', fontFamily: 'Inter, sans-serif' },
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return shadcnToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      className: 'toast-warning bg-yellow-100 text-yellow-800 border-yellow-300',
      style: { borderRadius: '8px', padding: '12px', fontFamily: 'Inter, sans-serif' },
    });
  },

  notification: (message: string, options?: NotificationToastOptions) => {
    const handleClick = () => {
      if (options?.onClick) {
        options.onClick();
      } else {
        // Assuming Navigate is from a router like react-router-dom
        window.location.href = '/notifications';
      }
    };

    return shadcnToast(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action || {
        label: 'View',
        onClick: handleClick,
      },
      className: 'toast-notification bg-purple-100 text-purple-800 border-purple-300 cursor-pointer',
      style: { borderRadius: '8px', padding: '12px', fontFamily: 'Inter, sans-serif' },
    });
  },
};
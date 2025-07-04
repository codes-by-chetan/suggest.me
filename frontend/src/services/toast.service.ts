"use client";

import { toast as shadcnToast } from "@/components/ui/use-toast";
import { Navigate, useNavigate } from "react-router";

type ToastType = "success" | "error" | "info" | "warning" | "notification";

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

interface NotificationToastOptions extends ToastOptions {
  onClick?: () => void;
}

export const useToast = () => {
  const toast = {
    success: (message: string, options?: ToastOptions) => {
      return shadcnToast({
        title: options?.title || "✅ Success",
        description: message,
        duration: options?.duration || 3000,
        className: "toast-success",
      });
    },

    error: (message: string, options?: ToastOptions) => {
      return shadcnToast({
        title: options?.title || "❌ Error",
        description: message,
        duration: options?.duration || 5000,
        className: "toast-error",
      });
    },

    info: (message: string, options?: ToastOptions) => {
      return shadcnToast({
        title: options?.title || "ℹ️ Information",
        description: message,
        duration: options?.duration || 4000,
        className: "toast-info",
      });
    },

    warning: (message: string, options?: ToastOptions) => {
      return shadcnToast({
        title: options?.title || "⚠️ Warning",
        description: message,
        duration: options?.duration || 4000,
        className: "toast-warning",
      });
    },

    notification: (message: string, options?: NotificationToastOptions) => {
      const handleClick = () => {
        if (options?.onClick) {
          options.onClick();
        } else {
          Navigate({
            to: "/notifications",
          });
        }
      };

      return shadcnToast({
        title: options?.title || "🔔 New Notification",
        description: message,
        duration: options?.duration || 6000,
        className: "toast-notification cursor-pointer",

        onClick: handleClick,
      });
    },
  };

  return { toast };
};

export const {toast} = useToast();

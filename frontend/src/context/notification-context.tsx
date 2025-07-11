import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
  Notification,
  dismissNotification,
  dismissAllNotifications,
} from "@/services/notification.service";
import { useSocket } from "./socket-context";
import { toast } from "@/services/toast.service";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  dismissAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    const loadNotifications = async () => {
      try {
        const res = await fetchNotifications();
        console.log("Fetched notifications:", res);
        setNotifications(res.data || []);
        setUnreadCount(
          (res.data || []).filter((n: Notification) => n.status === "Unread")
            .length
        );
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    loadNotifications();

    subscribeToNotifications(socket, (notification: Notification) => {
      toast.info(notification.message)
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n._id)); // Declare inside callback
        if (notification.status === "Dismissed") {
          // Remove notification if status is Dismissed
          const newNotifications = prev.filter(
            (n) => n._id !== notification._id
          );
          console.log(newNotifications);
          return newNotifications;
        } else if (existingIds.has(notification._id)) {
          // Replace existing notification
          return prev
            .map((n) => (n._id === notification._id ? notification : n))
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            ); // Sort by createdAt
        } else {
          // Add new notification at 0th index
          return [notification, ...prev].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
      });
      // console.log("updated notifications:  ", notifications);
      setUnreadCount((prev) => {
        const existingIds = new Set(notifications.map((n) => n._id)); // Use current notifications state
        if (existingIds.has(notification._id)) {
          const oldNotification = notifications.find(
            (n) => n._id === notification._id
          );
          if (
            oldNotification?.status === "Unread" &&
            notification.status !== "Unread"
          ) {
            return Math.max(0, prev - 1); // Decrease if status changed from Unread
          } else if (
            oldNotification?.status !== "Unread" &&
            notification.status === "Unread"
          ) {
            return prev + 1; // Increase if status changed to Unread
          }
          return prev; // No change if status remains same
        } else if (notification.status === "Unread") {
          return prev + 1; // Increase for new Unread notification
        } else if (notification.status === "Dismissed") {
          if (notifications.length < 1) {
            return 0
          }
          return prev; // No change for Dismissed (already removed from list)
        }
        return prev; // No change for other cases
      });

      
    });

    // No cleanup needed since socket is managed globally
  }, [isAuthenticated, user?._id]);

  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id).then((response) => {
        if (response.success) {
          console.log(response.data);

          setNotifications((prev) =>
            prev.map((n) =>
              n._id === id ? (response.data as Notification) : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };
  const dismiss = async (id: string) => {
    try {
      await dismissNotification(id).then((response) => {
        if (response.success) {
          console.log(response.data);

          setNotifications(
            (prev) => prev.filter((n) => n._id !== id) // Remove the notification from the array
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      });
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user._id).then((response) => {
        if (response.success) {
          setNotifications((prev) =>
            prev.map((n) => ({ ...n, status: "Read" }))
          );
          setUnreadCount(0);
        }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "Read" })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };
  const dismissAll = async () => {
    try {
      await dismissAllNotifications().then((response) => {
        if (response.success) {
          setNotifications([]);
          setUnreadCount(0);
        }
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        dismiss,
        dismissAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

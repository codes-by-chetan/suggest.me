/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiResponse } from '@/interfaces/api/api-response.interface';
import api from './api.service';

interface NotificationResponse {
  statusCode: number;
  data: Notification[] | null;
  message: string;
  success: boolean;
  redirect: null;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: Sender;
  type: string;
  message: string;
  status: string;
  metadata: Metadata;
  isVerified: boolean;
  isActive: boolean;
  createdBy: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  id: string;
  [key: string]: any;
}

interface Metadata {
  followRequestStatus: string;
  followRequestId: string;
  _id: string;
  id: string;
  [key: string]: any;
}

interface Sender {
  _id: string;
  fullName: FullName;
  profile: Profile;
  fullNameString: string;
  id: string;
  [key: string]: any;
}

interface Profile {
  _id: string;
  isComplete: boolean;
  avatar: { url: string; publicId: string; [key: string]: any };
  id: string;
  [key: string]: any;
}

interface FullName {
  firstName: string;
  lastName: string;
  _id: string;
  [key: string]: any;
}

// Subscribes to real-time notifications via WebSocket
export const subscribeToNotifications = (
  socket: any = null,
  callback: (notification: Notification) => void
) => {
  if (!socket) return;

  socket.on('notification', (notification: Notification) => {
    callback(notification);
  });
};

// Fetches notifications for a user
export const fetchNotifications = async (
  params: any = {}
): Promise<ApiResponse<NotificationResponse['data']>> =>
  api.get('notifications', params);
// Marks a single notification as read
export const markNotificationAsRead = async (
  notificationId: string,
  params: any = {}
): Promise<ApiResponse<any>> =>
  api.post(`notifications/mark/read/${notificationId}`, {}, params);

// Marks all notifications as read for a user
export const markAllNotificationsAsRead = async (
  params: any = {}
): Promise<ApiResponse<any>> =>
  api.post('notifications/mark/all/read', {}, params);

// Dismisses a single notification
export const dismissNotification = async (
  notificationId: string,
  params: any = {}
): Promise<ApiResponse<any>> =>
  api.post(
    `notifications/mark/dismiss/${notificationId}`,
    {},
    params
  );

// Dismisses all notifications for a user
export const dismissAllNotifications = async (
  params: any = {}
): Promise<ApiResponse<any>> =>
  api.post('notifications/mark/all/dismiss', {}, params);

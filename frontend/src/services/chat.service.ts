import { Chat, Message } from "@/interfaces/chat.interfaces";
import { mockChats, mockMessages } from "@/data/mockChats";
import { getAccessToken } from "./notification.service";
import api from "./api.service";

// In a real app, these would be API calls to your backend
export const getChats = async (): Promise<Chat[]> => {
  // Simulate API call with mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockChats);
    }, 500);
  });

  // Real API call would look like this:
  // return api
  //   .get(`chats`, {
  //     headers: {
  //       Authorization: `Bearer ${getAccessToken()}`,
  //     },
  //   })
  //   .then((response) => {
  //     return response.data.data;
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return [];
  //   });
};

export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  // Simulate API call with mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMessages[chatId] || []);
    }, 500);
  });

  // Real API call would look like this:
  // return api
  //   .get(`chats/${chatId}/messages`, {
  //     headers: {
  //       Authorization: `Bearer ${getAccessToken()}`,
  //     },
  //   })
  //   .then((response) => {
  //     return response.data.data;
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return [];
  //   });
};

export const sendMessage = async (
  chatId: string,
  content: string,
  attachments?: any[],
  suggestion?: any,
): Promise<Message> => {
  // Simulate API call with mock data
  const newMessage: Message = {
    id: `msg${Date.now()}`,
    senderId: "user1", // Current user
    senderName: "Current User",
    content,
    timestamp: new Date().toISOString(),
    isRead: false,
    attachments,
    suggestion,
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real app, this would be handled by the server
      if (!mockMessages[chatId]) {
        mockMessages[chatId] = [];
      }
      mockMessages[chatId].push(newMessage);

      // Update the last message in the chat
      const chatIndex = mockChats.findIndex((chat) => chat.id === chatId);
      if (chatIndex !== -1) {
        mockChats[chatIndex].lastMessage = newMessage;
        mockChats[chatIndex].updatedAt = newMessage.timestamp;
      }

      resolve(newMessage);
    }, 300);
  });

  // Real API call would look like this:
  // return api
  //   .post(`chats/${chatId}/messages`, {
  //     content,
  //     attachments,
  //     suggestion
  //   }, {
  //     headers: {
  //       Authorization: `Bearer ${getAccessToken()}`,
  //     },
  //   })
  //   .then((response) => {
  //     return response.data.data;
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     throw err;
  //   });
};

export const createChat = async (
  participantIds: string[],
  name?: string,
  isGroup: boolean = false,
): Promise<Chat> => {
  // Simulate API call with mock data
  const newChat: Chat = {
    id: `chat${Date.now()}`,
    type: isGroup ? "group" : "direct",
    name: isGroup ? name : undefined,
    participants
    unreadCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      mockChats.unshift(newChat);
      mockMessages[newChat.id] = [];
      resolve(newChat);
    }, 500);
  });

  // Real API call would look like this:
  // return api
  //   .post(`chats`, {
  //     participantIds,
  //     name,
  //     isGroup
  //   }, {
  //     headers: {
  //       Authorization: `Bearer ${getAccessToken()}`,
  //     },
  //   })
  //   .then((response) => {
  //     return response.data.data;
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     throw err;
  //   });
};

export const markChatAsRead = async (chatId: string): Promise<void> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const chatIndex = mockChats.findIndex((chat) => chat.id === chatId);
      if (chatIndex !== -1) {
        mockChats[chatIndex].unreadCount = 0;
      }
      resolve();
    }, 300);
  });

  // Real API call would look like this:
  // return api
  //   .post(`chats/${chatId}/read`, {}, {
  //     headers: {
  //       Authorization: `Bearer ${getAccessToken()}`,
  //     },
  //   })
  //   .then((response) => {
  //     return response.data.data;
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     throw err;
  //   });
};

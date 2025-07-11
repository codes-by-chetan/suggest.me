import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSocket } from "@/lib/socket-context";
import api from "@/services/api.service";
import { toast } from "@/services/toast.service";
import { Chat, Message } from "@/interfaces/chat.interfaces";

interface ChatContextType {
  chats: Chat[];
  fetchChats: () => Promise<void>;
  updateChatOnNewMessage: (chatId: string, message: Message) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [chats, setChats] = useState<Chat[]>([]);

  // Fetch all chats for the user
  const fetchChats = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      const { data } = await api.get("/chats");
      setChats(data.data);
    } catch (error) {
      toast.error("Failed to load chats", { description: error.message });
    }
  }, [isAuthenticated, user]);

  // Update chat list on new message
  const updateChatOnNewMessage = useCallback((chatId: string, message: Message) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat._id === chatId
          ? {
              ...chat,
              lastMessage: message,
              lastContactTime: message.createdAt,
              unreadCount: chat._id === message.chat ? (chat.unreadCount || 0) + 1 : chat.unreadCount,
            }
          : chat
      )
    );

    // Show toast notification for new messages
    const chat = chats.find((c) => c._id === chatId);
    if (chat) {
      const senderName = message.sender.fullName || "Unknown";
      const chatName = chat.chatType === "group" ? chat.groupName : senderName;
      toast.info(`New message from ${chatName}`, {
        description: message.content,
      });
    }
  }, [chats]);

  // Listen for new messages to update chat list
  useEffect(() => {
    if (!socket || !user) return;

    socket.on("newMessage", ({ chatId, message }: { chatId: string; message: Message }) => {
      updateChatOnNewMessage(chatId, message);
    });

    return () => {
      socket.off("newMessage");
    };
  }, [socket, user, updateChatOnNewMessage]);

  // Fetch chats on mount
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        fetchChats,
        updateChatOnNewMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
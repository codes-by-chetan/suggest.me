import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth-context";
import config from "@/config/env.config";

const API_BASE_URL = config.SOCKET_URL;

interface SocketContextType {
  socket: Socket | null;
  initializeSocket: () => void;
  disconnectSocket: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  const initializeSocket = () => {
    if (!socket) {
      setSocket(
        io(API_BASE_URL, {
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
        })
      );
    }
    if (socket) {
      socket.on("connect", () => {
        console.log("Socket connected globally:", socket.id);
      });
      socket.on("disconnect", () => {
        console.log("Socket disconnected globally");
      });
    }
    return socket;
  };

  const connectSocket = useCallback(() => {
    if (!isAuthenticated || !user) return;
    socket.emit("join", user._id);

    socket.on("connect", () => {
      console.log("Socket connected, joining room:", user._id);
      socket.emit("join", user._id);
    });

    socket.on("reconnect", () => {
      console.log("Socket reconnected, rejoining room:", user._id);
      socket.emit("join", user._id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  }, [isAuthenticated, user?._id]);

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      console.log("Socket disconnected manually");
    }
  };

  useEffect(() => {
    initializeSocket();
    if (isAuthenticated && user?._id) {
      connectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user?._id]);

  return (
    <SocketContext.Provider
      value={{ socket, initializeSocket, disconnectSocket }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

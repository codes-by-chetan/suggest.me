export interface Chat {
  _id: string;
  chatType: "private" | "group";
  participants: Participant[];
  groupName?: string;
  createdAt: string;
  updatedAt?: string;
  unreadCount?: number;
  lastMessage?: Message;
  [key: string]: any;
}
export interface Participant {
  _id: string;
  fullName: FullName;
  profile: Profile;
  fullNameString: string;
  id: string;
  [key: string]: any;
}

interface Profile {
  _id: string;
  isVerified: boolean;
  avatar: Avatar;
  displayName?: string;
  isComplete: boolean;
  id: string;
  [key: string]: any;
}

interface Avatar {
  publicId: string;
  url: string;
  _id: string;
  id: string;
  [key: string]: any;
}

interface FullName {
  firstName: string;
  lastName: string;
  _id: string;
}
export interface Message {
  _id: string;
  chat: string;
  sender: { _id: string; fullName: string };
  content: string; // Decrypted content
  createdAt: string;
  readBy: { user: string; readAt: string }[];
  suggestion?: {
    id: string;
    title: string;
    type: string;
    imageUrl: string;
    creator: string;
    year: string;
  };
}

export interface Attachment {
  id: string;
  type: "image" | "video" | "file";
  url: string;
  name?: string;
  size?: number;
  thumbnailUrl?: string;
}

export interface SuggestionPreview {
  id: string;
  title: string;
  type: string;
  imageUrl?: string;
  creator?: string;
  year?: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  isAdmin?: boolean; // For group chats
  isOnline?: boolean;
  lastSeen?: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  participants: ChatParticipant[];
  createdAt: string;
  updatedAt: string;
}

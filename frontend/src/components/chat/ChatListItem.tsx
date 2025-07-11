import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Chat, Participant } from '@/interfaces/chat.interfaces';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

interface ChatListItemProps {
  chat: Chat;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

function ChatListItem({
  chat,
  selectedChatId,
  onSelectChat,
}: ChatListItemProps) {
  const [chatPartner, setChatPartner] = useState<Participant | null>(null);
  const { user } = useAuth();

  const setChatData = useCallback(() => {
    if (chat.chatType === 'private') {
      chat.participants.forEach((participant) => {
        if (participant._id !== user._id) {
          setChatPartner(participant);
        }
      });
    }
  }, [chat]);

  useEffect(() => {
    setChatData();
  }, []);

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (_error) {
      return '';
    }
  };
  return (
    <div
      key={chat._id}
      className={cn(
        'hover:bg-accent/50 flex cursor-pointer items-center rounded-lg p-3 transition-colors',
        selectedChatId === chat._id && 'bg-accent'
      )}
      onClick={() => onSelectChat(chat._id)}
    >
      <div className='relative'>
        <Avatar className='h-12 w-12'>
          <AvatarImage src={chatPartner?.profile?.avatar?.url} />
          <AvatarFallback className='bg-primary/10 text-primary'>
            {chatPartner?.fullName?.firstName.toLocaleUpperCase().charAt(0)}
            {chatPartner?.fullName?.lastName.toLocaleUpperCase().charAt(0)}
          </AvatarFallback>
        </Avatar>
        {chat.chatType === 'private' && (
          <span
            className={cn(
              'border-background absolute right-0 bottom-0 h-3 w-3 rounded-full border-2',
              'bg-green-500' // Mocked
            )}
          />
        )}
      </div>
      <div className='ml-3 flex-1 overflow-hidden'>
        <div className='flex items-center justify-between'>
          <h3 className='truncate text-sm font-medium'>
            {chatPartner?.fullNameString || chat?.groupName || 'Unknown'}
          </h3>
          <span className='text-muted-foreground text-xs'>
            {formatTime(chat.updatedAt || chat.createdAt)}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <p className='text-muted-foreground max-w-[180px] truncate text-xs'>
            {chat.lastMessage?.content || 'No messages yet'}
          </p>
          {chat.unreadCount && chat.unreadCount > 0 ? (
            <span className='bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full text-xs'>
              {chat.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ChatListItem;

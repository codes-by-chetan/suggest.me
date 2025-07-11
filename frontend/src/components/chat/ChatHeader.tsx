import React, { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from '@tanstack/react-router';
import { Chat, Participant } from '@/interfaces/chat.interfaces';
import {
  Info,
  Phone,
  Video,
  MoreVertical,
  Users,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  chat: Chat;
  onViewInfo: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ chat, onViewInfo }) => {
  const [chatPartner, setChatPartner] = useState<Participant | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const _formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (_error) {
      return '';
    }
  };

  // const getChatName = () => {
  //   if (chat.chatType === "group") return chat.groupName || "Unnamed Group";
  //   const otherParticipant = chat.participants.find((p) => p._id !== user._id);
  //   return otherParticipant?.fullName || "Unknown";
  // };

  // const getChatAvatar = () => {
  //   // Mock avatar since it's not in the schema
  //   if (chat.chatType === "group") return "";
  //   const otherParticipant = chat.participants.find((p) => p._id !== user._id);
  //   return otherParticipant ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant.fullName}` : "";
  // };

  // const getInitials = (name: string) => {
  //   return name
  //     .split(" ")
  //     .map((n) => n[0])
  //     .join("")
  //     .toUpperCase();
  // };

  const getOnlineStatus = () => {
    // Mock online status since it's not in the schema
    if (chat.chatType === 'group') {
      return `${chat.participants.length} members`;
    } else {
      const otherParticipant = chat.participants.find(
        (p) => p._id !== user._id
      );
      return otherParticipant ? 'Online' : 'Offline'; // Mocked
    }
  };
  const handleBackToList = () => {
    navigate({ to: '/chat' });
  };
  return (
    <div className='border-border bg-card flex w-full items-center justify-between border-b p-4'>
      <div className='flex items-center'>
        <Button
          variant='ghost'
          size='icon'
          className='ml-1'
          onClick={handleBackToList}
        >
          <ArrowLeft className='h-5 w-5' />
        </Button>
        <Avatar className='h-10 w-10'>
          <AvatarImage src={chatPartner?.profile?.avatar?.url} />
          <AvatarFallback className='bg-primary/10 text-primary'>
            {chatPartner?.fullName?.firstName.toLocaleUpperCase().charAt(0)}
            {chatPartner?.fullName?.lastName.toLocaleUpperCase().charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className='ml-3 overflow-hidden'>
          <h3 className='truncate font-medium'>
            {chatPartner?.fullNameString || chat?.groupName || 'Unknown'}
          </h3>
          <p className='text-muted-foreground flex items-center text-xs'>
            {chat.chatType === 'group' && <Users className='mr-1 h-3 w-3' />}
            {getOnlineStatus()}
          </p>
        </div>
      </div>
      <div className='flex flex-shrink-0 items-center space-x-1'>
        <Button
          variant='ghost'
          size='icon'
          className='hidden rounded-full sm:flex'
        >
          <Phone className='h-4 w-4' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          className='hidden rounded-full sm:flex'
        >
          <Video className='h-4 w-4' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          className='rounded-full'
          onClick={onViewInfo}
        >
          <Info className='h-4 w-4' />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon' className='rounded-full'>
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem>Mute notifications</DropdownMenuItem>
            <DropdownMenuItem>Search</DropdownMenuItem>
            <DropdownMenuSeparator />
            {chat.chatType === 'group' ? (
              <>
                <DropdownMenuItem>Add members</DropdownMenuItem>
                <DropdownMenuItem>Leave group</DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem>Block user</DropdownMenuItem>
                <DropdownMenuItem>Clear chat</DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className='text-destructive'>
              Delete chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatHeader;

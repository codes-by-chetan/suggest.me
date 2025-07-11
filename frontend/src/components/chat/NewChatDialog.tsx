import React, { useEffect, useState } from 'react';
import { UserService } from '@/services/user.service';
import { Search, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateChat: (
    participantIds: string[],
    name?: string,
    isGroup?: boolean
  ) => void;
  isGroup?: boolean;
}

interface User {
  _id: string;
  fullName: string;
  avatar?: string;
  email?: string;
}

const NewChatDialog: React.FC<NewChatDialogProps> = ({
  open,
  onOpenChange,
  onCreateChat,
  isGroup = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  // Mock users for demo purposes
  const mockUsers: User[] = [
    {
      _id: 'user2',
      fullName: 'Emma Watson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
      email: 'emma@example.com',
    },
    {
      _id: 'user3',
      fullName: 'John Smith',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      email: 'john@example.com',
    },
    {
      _id: 'user4',
      fullName: 'Sophia Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophia',
      email: 'sophia@example.com',
    },
    {
      _id: 'user5',
      fullName: 'Michael Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
      email: 'michael@example.com',
    },
    {
      _id: 'user6',
      fullName: 'Alex Rodriguez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      email: 'alex@example.com',
    },
  ];

  const [filteredUsers, setFilteredUsers] = useState(
    mockUsers.filter((user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  useEffect(() => {
    UserService.getUserFriends().then((res) => {
      if (res.success) {
        if (res.data) {
          setFilteredUsers(
            res.data.map((user) => ({
              _id: user._id,
              fullName: user.fullNameString,
              avatar: user?.profile?.avatar?.url,
            }))
          );
        }
      }
    });
  }, []);

  useEffect(() => {
    setFilteredUsers(
      mockUsers.filter((user) =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm]);
  const handleSelectUser = (user: User) => {
    if (selectedUsers.some((u) => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateChat = () => {
    if (selectedUsers.length === 0) return;

    onCreateChat(
      selectedUsers.map((user) => user._id),
      isGroup ? groupName : undefined,
      isGroup
    );

    // Reset state
    setSelectedUsers([]);
    setGroupName('');
    setSearchTerm('');
    onOpenChange(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md' aria-description='new-chat-dialog'>
        <DialogHeader>
          <DialogTitle>
            {isGroup ? 'Create Group Chat' : 'New Message'}
          </DialogTitle>
        </DialogHeader>

        {isGroup && (
          <div className='mb-4'>
            <Input
              placeholder='Group name'
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className='mb-2'
            />
          </div>
        )}

        <div className='relative'>
          <Search className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
          <Input
            placeholder='Search users...'
            className='pl-10'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {selectedUsers.length > 0 && (
          <div className='mt-2 flex flex-wrap gap-2'>
            {selectedUsers.map((user) => (
              <div
                key={user._id}
                className='bg-accent flex items-center gap-1 rounded-full px-2 py-1'
              >
                <Avatar className='h-5 w-5'>
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className='text-[10px]'>
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className='text-xs'>{user.fullName}</span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-4 w-4 rounded-full'
                  onClick={() => handleSelectUser(user)}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            ))}
          </div>
        )}

        <ScrollArea className='mt-4 h-[200px]'>
          <div className='space-y-2'>
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className='hover:bg-accent flex cursor-pointer items-center justify-between rounded-md p-2'
                onClick={() => handleSelectUser(user)}
              >
                <div className='flex items-center gap-3'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className='bg-primary/10 text-primary text-xs'>
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='text-sm font-medium'>{user.fullName}</p>
                    {user.email && (
                      <p className='text-muted-foreground text-xs'>
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <Checkbox
                  checked={selectedUsers.some((u) => u._id === user._id)}
                  onCheckedChange={() => handleSelectUser(user)}
                />
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className='text-muted-foreground py-4 text-center'>
                No users found
              </div>
            )}
          </div>
        </ScrollArea>

        <div className='mt-4 flex justify-end gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateChat}
            disabled={selectedUsers.length === 0 || (isGroup && !groupName)}
          >
            {isGroup ? 'Create Group' : 'Start Chat'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatDialog;

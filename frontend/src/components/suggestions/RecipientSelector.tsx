/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { searchPeople } from '@/services/search.service';
import UserService from '@/services/user.service';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export interface Recipient {
  fullName: FullName;
  profile: friendProfile;
  [key: string]: any;
}
interface friendProfile {
  avatar: Avatar;
  isVerified: boolean;
  [key: string]: any;
}
interface Avatar {
  publicId: string;
  url: string;
  [key: string]: any;
}

interface FullName {
  firstName: string;
  lastName: string;
  [key: string]: any;
}

interface RecipientSelectorProps {
  onSelect?: (recipients: Recipient[]) => void;
  onBack?: () => void;
  onComplete?: (recipients: Recipient[]) => void;
  preSelectedRecipients?: Recipient[];
  hideButtons?: boolean; // Add this prop
}

const RecipientSelector = ({
  onSelect = () => {},
  onBack = () => {},
  onComplete = () => {},
  preSelectedRecipients = [],
  hideButtons = false,
}: RecipientSelectorProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>(
    preSelectedRecipients
  );
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);

  // Mock data for search results
  const [users, setUsers] = useState<Recipient[]>([]);

  // Filter users based on search query
  const searchPeoples = useCallback(async () => {
    console.log('searchPeople : ', searchQuery);

    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const peoples = (await searchPeople({ searchTerm: searchQuery })).data;
    if (peoples) {
      const filteredResults = peoples.data.filter((people) => {
        if (people._id === user._id) return;
        return {
          _id: people._id,
          fullName: people.fullName,
          profile: {
            avatar: people.profile?.avatar || '',
            isVerified: people.profile?.isVerified || '',
            displayName: people.profile?.displayName || '',
          },
          fullNameString: people?.fullNameString || '',
        };
      });

      setSearchResults(filteredResults as Recipient[]);
    }
  }, [searchQuery]);
  useEffect(() => {
    searchPeoples();
  }, [searchQuery]);
  useEffect(() => {
    UserService.getUserFriends().then((res) => {
      if (res.success && res.data) {
        setUsers(res.data);
      }
    });
  }, []);

  const handleSelectRecipient = (recipient: Recipient) => {
    if (!selectedRecipients.some((r) => r._id === recipient._id)) {
      const newSelectedRecipients = [...selectedRecipients, recipient];
      setSelectedRecipients(newSelectedRecipients);
      onSelect(newSelectedRecipients);
    }
    setSearchQuery('');
  };

  const handleRemoveRecipient = (id: string) => {
    console.log(id);
    const newSelectedRecipients = selectedRecipients.filter(
      (r) => r._id !== id
    );
    setSelectedRecipients(newSelectedRecipients);
    console.log(selectedRecipients);
    onSelect(newSelectedRecipients);
  };

  const handleComplete = () => {
    onComplete(selectedRecipients);
  };

  return (
    <div className='dark:bg-muted flex w-full flex-col gap-4 rounded-lg bg-white p-6 shadow-sm'>
      <div className='mb-2 flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>Select Recipients</h2>
      </div>

      <div className='relative'>
        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
          <Search className='h-4 w-4 text-gray-400' />
        </div>
        <Input
          type='text'
          placeholder='Search for friends by name or email...'
          value={searchQuery}
          onChange={(e) => {
            console.log(e.target.value);
            setSearchQuery(e.target.value);
          }}
          className='pl-10'
        />
      </div>

      {/* Selected recipients */}
      {selectedRecipients.length > 0 && (
        <div className='mt-2 flex flex-wrap gap-2'>
          {selectedRecipients.map((recipient) => (
            <div
              key={recipient._id}
              className='dark:bg-muted-foreground flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1'
            >
              <Avatar className='h-6 w-6'>
                <AvatarImage
                  src={recipient.profile?.avatar?.url || '/placeholder.svg'}
                  alt={recipient.name}
                />
                <AvatarFallback>
                  {recipient.fullName.firstName.charAt(0)}
                  {recipient.fullName.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className='text-sm'>{recipient.fullNameString}</span>
              <button
                onClick={() => handleRemoveRecipient(recipient._id)}
                className='text-gray-500 hover:text-gray-700'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className='mt-2 overflow-hidden rounded-md border'>
          <ul className='divide-y'>
            {searchResults.map((user) => (
              <li
                key={user._id}
                className='flex cursor-pointer items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700'
                onClick={() => handleSelectRecipient(user)}
              >
                <div className='flex items-center gap-3'>
                  <Avatar>
                    <AvatarImage
                      src={user.profile?.avatar?.url || '/placeholder.svg'}
                      alt={user.fullNameString}
                    />
                    <AvatarFallback>
                      {user.fullName.firstName.charAt(0)}
                      {user.fullName.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>{user.fullNameString}</p>
                    {user.displayName && (
                      <p className='text-sm text-gray-500'>
                        {user.displayName}
                      </p>
                    )}
                  </div>
                </div>
                <Checkbox
                  checked={selectedRecipients.some((r) => r._id === user._id)}
                  onCheckedChange={() => handleSelectRecipient(user)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested recipients */}
      <div className='mt-4'>
        <h3 className='mb-2 text-sm font-medium text-gray-500'>Suggested</h3>
        <div className='grid grid-cols-1 gap-2'>
          {users.slice(0, 3).map((user) => (
            <div
              key={user._id}
              className={cn(
                'flex items-center justify-between rounded-md p-3',
                selectedRecipients.some((r) => r._id === user._id)
                  ? 'bg-gray-100 dark:bg-gray-700'
                  : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
              onClick={() => {
                if (!selectedRecipients.some((r) => r.id === user.id)) {
                  handleSelectRecipient(user);
                }
              }}
            >
              <div className='flex items-center gap-3'>
                <Avatar>
                  <AvatarImage
                    src={user.profile?.avatar?.url || '/placeholder.svg'}
                    alt={user.fullNameString}
                  />
                  <AvatarFallback>
                    {user.fullName.firstName.charAt(0)}
                    {user.fullName.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-medium'>{user.fullNameString}</p>
                  {user.displayName && (
                    <p className='text-sm text-gray-500'>{user.displayName}</p>
                  )}
                </div>
              </div>
              <Checkbox
                checked={selectedRecipients.some((r) => r._id === user._id)}
                onCheckedChange={() => {
                  if (selectedRecipients.some((r) => r._id === user._id)) {
                    handleRemoveRecipient(user._id);
                  } else {
                    handleSelectRecipient(user);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {!hideButtons && (
        <div className='mt-6 flex justify-between'>
          <Button variant='outline' onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleComplete}
            disabled={selectedRecipients.length === 0}
          >
            {selectedRecipients.length === 0
              ? 'Select Recipients'
              : `Send to ${selectedRecipients.length} ${selectedRecipients.length === 1 ? 'person' : 'people'}`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecipientSelector;

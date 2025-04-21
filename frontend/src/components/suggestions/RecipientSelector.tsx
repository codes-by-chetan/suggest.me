import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

const mockUsers: Recipient[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    email: 'alex@example.com',
  },
  {
    id: '2',
    name: 'Jamie Smith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jamie',
    email: 'jamie@example.com',
  },
  {
    id: '3',
    name: 'Taylor Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taylor',
    email: 'taylor@example.com',
  },
  {
    id: '4',
    name: 'Jordan Lee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
    email: 'jordan@example.com',
  },
  {
    id: '5',
    name: 'Casey Brown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=casey',
    email: 'casey@example.com',
  },
]

interface Recipient {
  id: string
  name: string
  avatar?: string
  email?: string
}

interface RecipientSelectorProps {
  onSelect?: (recipients: Recipient[]) => void
  onBack?: () => void
  onComplete?: (recipients: Recipient[]) => void
  preSelectedRecipients?: Recipient[]
}

const RecipientSelector = ({
  onSelect = () => {},
  onBack = () => {},
  onComplete = () => {},
  preSelectedRecipients = [],
}: RecipientSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>(
    preSelectedRecipients
  )
  const [searchResults, setSearchResults] = useState<Recipient[]>([])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([])
      return
    }

    const filteredResults = mockUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email &&
          user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    setSearchResults(filteredResults)
  }, [searchQuery])

  const handleSelectRecipient = (recipient: Recipient) => {
    if (!selectedRecipients.some((r) => r.id === recipient.id)) {
      const newSelectedRecipients = [...selectedRecipients, recipient]
      setSelectedRecipients(newSelectedRecipients)
      onSelect(newSelectedRecipients)
    }
    setSearchQuery('')
  }

  const handleRemoveRecipient = (id: string) => {
    const newSelectedRecipients = selectedRecipients.filter((r) => r.id !== id)
    setSelectedRecipients(newSelectedRecipients)
    onSelect(newSelectedRecipients)
  }

  const handleComplete = () => {
    onComplete(selectedRecipients)
  }

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
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-10'
        />
      </div>

      {/* Selected recipients */}
      {selectedRecipients.length > 0 && (
        <div className='mt-2 flex flex-wrap gap-2'>
          {selectedRecipients.map((recipient) => (
            <div
              key={recipient.id}
              className='dark:bg-muted-foreground flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1'
            >
              <Avatar className='h-6 w-6'>
                <AvatarImage src={recipient.avatar} alt={recipient.name} />
                <AvatarFallback>{recipient.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className='text-sm'>{recipient.name}</span>
              <button
                onClick={() => handleRemoveRecipient(recipient.id)}
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
                key={user.id}
                className='flex cursor-pointer items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700'
                onClick={() => handleSelectRecipient(user)}
              >
                <div className='flex items-center gap-3'>
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>{user.name}</p>
                    {user.email && (
                      <p className='text-sm text-gray-500'>{user.email}</p>
                    )}
                  </div>
                </div>
                <Checkbox
                  checked={selectedRecipients.some((r) => r.id === user.id)}
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
          {mockUsers.slice(0, 3).map((user) => (
            <div
              key={user.id}
              className={cn(
                'flex items-center justify-between rounded-md p-3',
                selectedRecipients.some((r) => r.id === user.id)
                  ? 'bg-gray-100 dark:bg-gray-700'
                  : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
              onClick={() => {
                if (!selectedRecipients.some((r) => r.id === user.id)) {
                  handleSelectRecipient(user)
                }
              }}
            >
              <div className='flex items-center gap-3'>
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-medium'>{user.name}</p>
                  {user.email && (
                    <p className='text-sm text-gray-500'>{user.email}</p>
                  )}
                </div>
              </div>
              <Checkbox
                checked={selectedRecipients.some((r) => r.id === user.id)}
                onCheckedChange={() => {
                  if (selectedRecipients.some((r) => r.id === user.id)) {
                    handleRemoveRecipient(user.id)
                  } else {
                    handleSelectRecipient(user)
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

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
    </div>
  )
}

export default RecipientSelector

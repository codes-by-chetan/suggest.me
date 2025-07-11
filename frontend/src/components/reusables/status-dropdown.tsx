'use client';

import { useState } from 'react';
import {
  CheckCircle,
  Clock,
  Bookmark,
  XCircle,
  Loader2,
  LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StatusDropdownProps {
  currentStatus: string | null;
  contentType: string;
  onStatusChange: (
    status: 'WantToConsume' | 'Consuming' | 'Consumed' | 'NotInterested'
  ) => Promise<void>;
  loading?: Record<string, boolean>;
  size?: 'xs' | 'sm';
}

export function StatusDropdown({
  currentStatus,
  contentType,
  onStatusChange,
  loading = {},
  size = 'sm',
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusOptions = (): {
    value: 'WantToConsume' | 'Consuming' | 'Consumed' | 'NotInterested';
    label: string;
    icon: React.ForwardRefExoticComponent<
      Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
    >;
  }[] => [
    {
      value: 'Consumed',
      label: getStatusLabel('Consumed', contentType),
      icon: CheckCircle,
    },
    {
      value: 'Consuming',
      label: getStatusLabel('Consuming', contentType),
      icon: Clock,
    },
    {
      value: 'WantToConsume',
      label: getStatusLabel('WantToConsume', contentType),
      icon: Bookmark,
    },
    { value: 'NotInterested', label: 'Not Interested', icon: XCircle },
  ];

  const getStatusLabel = (status: string, type: string): string => {
    if (status === 'NotInterested') return 'Not Interested';
    if (status === 'WantToConsume') {
      return type === 'book'
        ? 'Reading List'
        : type === 'music' || type === 'song'
          ? 'Listening List'
          : 'Watchlist';
    }
    switch (type) {
      case 'book':
        return status === 'Consumed' ? 'Finished' : 'Reading';
      case 'music':
      case 'song':
        return status === 'Consumed' ? 'Listened' : 'Listening';
      default:
        return status === 'Consumed' ? 'Watched' : 'Watching';
    }
  };

  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case 'Consumed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Consuming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'WantToConsume':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'NotInterested':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getCurrentIcon = () => {
    switch (currentStatus) {
      case 'Consumed':
        return CheckCircle;
      case 'Consuming':
        return Clock;
      case 'WantToConsume':
        return Bookmark;
      case 'NotInterested':
        return XCircle;
      default:
        return Bookmark;
    }
  };

  const CurrentIcon = getCurrentIcon();

  const handleStatusChange = async (
    status: 'WantToConsume' | 'Consuming' | 'Consumed' | 'NotInterested'
  ) => {
    setIsOpen(false);
    await onStatusChange(status);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='icon'
          className={cn(
            'rounded-full border-none',
            currentStatus && getStatusBadgeColor(currentStatus),
            size === 'xs' ? 'h-5 w-5 p-0' : 'h-6 w-6 p-0'
          )}
          title={
            currentStatus
              ? getStatusLabel(currentStatus, contentType)
              : 'Add to List'
          }
        >
          <CurrentIcon className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-36 p-1'>
        {getStatusOptions().map((option) => {
          const Icon = option.icon;
          const isLoading = loading[option.value.toLowerCase()];
          const isCurrent = option.value === currentStatus;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={isLoading || isCurrent}
              className={cn(
                'flex cursor-pointer items-center gap-2 py-1.5 text-xs',
                isCurrent && 'bg-accent'
              )}
            >
              {isLoading ? (
                <Loader2 className='h-3 w-3 animate-spin' />
              ) : (
                <Icon className='h-3 w-3' />
              )}
              <span>{option.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

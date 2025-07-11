import { useNavigate } from '@tanstack/react-router';
import { Suggestor, suggestorsArray } from '@/data/suggestors';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SuggestorsListProps {
  suggestors?: Suggestor[];
  onSuggestorClick?: (suggestor: Suggestor) => void;
  className?: string;
}

interface SuggestorCardProps {
  suggestor: Suggestor;
  onSuggestorClick: (suggestor: Suggestor) => void;
  navigate: ReturnType<typeof useNavigate>;
}

const SuggestorCard = ({
  suggestor,
  onSuggestorClick,
  navigate,
}: SuggestorCardProps) => (
  <Card
    className='cursor-pointer transition-shadow duration-300 hover:shadow-md'
    onClick={() => onSuggestorClick(suggestor)}
  >
    <CardHeader className='pb-2'>
      <div className='flex items-center space-x-3'>
        <Avatar>
          <AvatarImage src={suggestor.avatar} alt={suggestor.name} />
          <AvatarFallback>
            {suggestor.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <CardTitle
          className='text-foreground text-lg '
          onClick={() => navigate({ to: `/profile/${suggestor.id}` })}
        >
          {suggestor.name}
        </CardTitle>
      </div>
    </CardHeader>
    <CardContent className='pt-2 pb-0'>
      <p className='text-muted-foreground text-sm'>
        Has suggested {suggestor.suggestionCount}{' '}
        {suggestor.suggestionCount === 1 ? 'item' : 'items'} to you
      </p>
    </CardContent>
    <CardFooter className='pt-4'>
      <button
        className='text-primary hover:text-primary/80 text-sm font-medium'
        onClick={(e) => {
          e.stopPropagation();
          onSuggestorClick(suggestor);
        }}
      >
        View suggestions
      </button>
    </CardFooter>
  </Card>
);

const SuggestorsList = ({
  suggestors = suggestorsArray,
  onSuggestorClick = () => {},
  className = '',
}: SuggestorsListProps) => {
  const navigate = useNavigate();
  if (suggestors.length === 0) {
    return (
      <div className='bg-card flex flex-col items-center justify-center rounded-lg p-8 shadow-sm'>
        <Users className='text-muted-foreground mb-4 h-16 w-16' />
        <h3 className='text-foreground text-xl font-medium'>
          No suggestors yet
        </h3>
        <p className='text-muted-foreground mt-2 text-center'>
          When people suggest content to you, they'll appear here.
        </p>
      </div>
    );
  }

  

  return (
    <div className={cn('bg-card w-full p-4', className)}>
      <h2 className='text-foreground mb-6 text-2xl font-bold'>
        People who suggested to you
      </h2>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
        {suggestors.map((suggestor) => (
          <motion.div
            key={suggestor.id}
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <SuggestorCard
              suggestor={suggestor}
              onSuggestorClick={onSuggestorClick}
              navigate={navigate}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SuggestorsList;

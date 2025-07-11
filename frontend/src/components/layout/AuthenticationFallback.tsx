import type React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Lock, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AuthenticationFallbackProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function AuthenticationFallback({
  title,
  description,
  icon,
}: AuthenticationFallbackProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='mx-auto w-full px-4 pt-0 pb-[10vh] sm:px-6 lg:px-8'
    >
      <div className='py-6'>
        <div className='flex min-h-[60vh] items-center justify-center'>
          <Card className='shadow-social dark:shadow-social-dark mx-auto w-full max-w-md border-0'>
            <CardContent className='p-8 text-center'>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className='bg-primary/10 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full'
              >
                {icon || <Lock className='text-primary h-10 w-10' />}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className='text-foreground mb-3 text-2xl font-bold'
              >
                {title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className='text-muted-foreground mb-8 leading-relaxed'
              >
                {description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className='flex flex-col gap-3 sm:flex-row'
              >
                <Button
                  onClick={() => navigate({ to: '/sign-in' })}
                  className='flex-1 gap-2 rounded-full'
                  size='lg'
                >
                  <LogIn className='h-4 w-4' />
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate({ to: '/sign-up' })}
                  variant='outline'
                  className='flex-1 gap-2 rounded-full'
                  size='lg'
                >
                  <UserPlus className='h-4 w-4' />
                  Sign Up
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className='border-border mt-6 border-t pt-6'
              >
                <p className='text-muted-foreground text-xs'>
                  Join our community to discover amazing content recommendations
                  from friends and fellow enthusiasts.
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

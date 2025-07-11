/* eslint-disable no-console */
import { useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '../ui/separator';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }),
});

const signupSchema = z
  .object({
    fullName: z.object({
      firstName: z
        .string()
        .min(2, { message: 'First name must be at least 2 characters' }),
      lastName: z
        .string()
        .min(2, { message: 'Last name must be at least 2 characters' }),
    }),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z.string(),
    contactNumber: z.object({
      countryCode: z
        .string(),
      number: z.string().min(1, { message: 'Phone number is required' }),
    }),
    terms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

interface AuthDialogProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  redirectTo?: string;
  defaultTab?: 'login' | 'signup';
}

export function AuthTab({
  isOpen,
  onClose,
  defaultTab = 'login',
}: AuthDialogProps) {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  const loginContentRef = useRef<HTMLDivElement>(null);
  const signupContentRef = useRef<HTMLDivElement>(null);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: {
        firstName: '',
        lastName: '',
      },
      email: '',
      password: '',
      confirmPassword: '',
      contactNumber: {
        countryCode: '+1',
        number: '',
      },
      terms: false,
    },
  });

  // Update height when tab changes
  useEffect(() => {
    const updateHeight = () => {
      const activeRef =
        activeTab === 'login' ? loginContentRef : signupContentRef;
      if (activeRef.current) {
        setContentHeight(activeRef.current.scrollHeight);
      }
    };

    // Small delay to ensure content is rendered
    const timer = setTimeout(updateHeight, 50);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Initial height calculation
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const activeRef =
          activeTab === 'login' ? loginContentRef : signupContentRef;
        if (activeRef.current) {
          setContentHeight(activeRef.current.scrollHeight);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await auth.login(values.email, values.password);
      if (success) {
        onClose(true);
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { confirmPassword, terms, ...userData } = values;
      const success = await auth.signup(userData);
      if (success) {
        onClose(true);
      } else {
        setError('Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'login' | 'signup');
    setError(null); // Clear errors when switching tabs
  };
  return (
    <>
      {/* Fixed Header */}
      <div className='flex-shrink-0 p-6 pb-4'>
        {error && (
          <div className='bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm'>
            {error}
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='login'>Sign In</TabsTrigger>
            <TabsTrigger value='signup'>Sign Up</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Animated Content Area */}
      <div className='flex-1 overflow-hidden'>
        <div
          className='overflow-hidden transition-all duration-300 ease-in-out'
          style={{ height: contentHeight > 0 ? `${contentHeight}px` : 'auto' }}
        >
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className='w-full !border-none shadow-none outline-none'
          >
            <TabsContent
              value='login'
              className='mt-0 px-6'
              ref={loginContentRef}
            >
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className='space-y-4'
                >
                  <FormField
                    control={loginForm.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Mail className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
                            <Input
                              placeholder='you@example.com'
                              className='pl-10'
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Lock className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder='••••••••'
                              className='pr-10 pl-10'
                              {...field}
                            />
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='absolute top-1 right-1 h-7 w-7'
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className='h-4 w-4' />
                              ) : (
                                <Eye className='h-4 w-4' />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent
              value='signup'
              className='mt-0 border-none px-6 pt-2'
              ref={signupContentRef}
            >
              <Form {...signupForm}>
                <form
                  onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                  className='space-y-4'
                >
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={signupForm.control}
                      name='fullName.firstName'
                      render={({ field }) => (
                        <FormItem>
                          {/* <FormLabel>First Name</FormLabel> */}
                          <FormControl>
                            <div className='relative'>
                              <User className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
                              <Input
                                placeholder='First name'
                                className='pl-10'
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name='fullName.lastName'
                      render={({ field }) => (
                        <FormItem>
                          {/* <FormLabel>Last Name</FormLabel> */}
                          <FormControl>
                            <div className='relative'>
                              <User className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
                              <Input
                                placeholder='Last name'
                                className='pl-10'
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={signupForm.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        {/* <FormLabel>Email</FormLabel> */}
                        <FormControl>
                          <div className='relative'>
                            <Mail className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
                            <Input
                              type='email'
                              placeholder='Email address'
                              className='pl-10'
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name='contactNumber.number'
                    render={({ field }) => (
                      <FormItem>
                        {/* <FormLabel>Phone Number</FormLabel> */}
                        <FormControl>
                          <Input
                            placeholder='Phone number'
                            {...field}
                            onChange={(e) => {
                              const currentValue =
                                signupForm.getValues('contactNumber');
                              signupForm.setValue('contactNumber', {
                                ...currentValue,
                                number: e.target.value,
                              });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={signupForm.control}
                      name='password'
                      render={({ field }) => (
                        <FormItem>
                          {/* <FormLabel>Password</FormLabel> */}
                          <FormControl>
                            <div className='relative'>
                              <Lock className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder='Password'
                                className='pr-10 pl-10'
                                {...field}
                              />
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='absolute top-1 right-1 h-7 w-7'
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className='h-4 w-4' />
                                ) : (
                                  <Eye className='h-4 w-4' />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name='confirmPassword'
                      render={({ field }) => (
                        <FormItem>
                          {/* <FormLabel>Confirm</FormLabel> */}
                          <FormControl>
                            <div className='relative'>
                              <Lock className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
                              <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder='Confirm'
                                className='pr-10 pl-10'
                                {...field}
                              />
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='absolute top-1 right-1 h-7 w-7'
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className='h-4 w-4' />
                                ) : (
                                  <Eye className='h-4 w-4' />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={signupForm.control}
                    name='terms'
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-start space-y-0 space-x-3 rounded-md border p-3'>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className='space-y-1 leading-none'>
                          <FormLabel className='text-sm'>
                            I agree to the Terms of Service and Privacy Policy
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className='border-border flex-shrink-0 space-y-4 border-t p-6 pt-4'>
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <Separator className='w-full' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background text-muted-foreground px-2'>
              Or continue with
            </span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <Button variant='outline' type='button' disabled={isLoading}>
            <svg className='mr-2 h-4 w-4' viewBox='0 0 24 24'>
              <path
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                fill='#4285F4'
              />
              <path
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                fill='#34A853'
              />
              <path
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                fill='#FBBC05'
              />
              <path
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                fill='#EA4335'
              />
            </svg>
            Google
          </Button>
          <Button variant='outline' type='button' disabled={isLoading}>
            <svg
              className='mr-2 h-4 w-4'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z' />
            </svg>
            Facebook
          </Button>
        </div>
      </div>
    </>
  );
}

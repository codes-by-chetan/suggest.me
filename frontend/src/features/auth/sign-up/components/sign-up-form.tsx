import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconBrandFacebook, IconBrandGithub } from '@tabler/icons-react'
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { Checkbox } from "@/components/ui/checkbox";
import "react-intl-tel-input/dist/main.css";
import IntlTelInput from "react-intl-tel-input";
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/context/auth-context'
import { Link } from '@tanstack/react-router'
import "./signup.css";
type SignUpFormProps = HTMLAttributes<HTMLFormElement>

const formSchema = z
  .object({
    fullName: z.object({
      firstName: z
        .string()
        .min(2, { message: "First name must be at least 2 characters" }),
      lastName: z
        .string()
        .min(2, { message: "Last name must be at least 2 characters" }),
    }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
    contactNumber: z.object({ countryCode: z.string(), number: z.string() }),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpData = z.infer<typeof formSchema>;

export function SignUpForm({ className, ...props }: SignUpFormProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const form = useForm<SignUpData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: {
        firstName: "",
        lastName: "",
      },
      email: "",
      password: "",
      confirmPassword: "",
      contactNumber: {
        countryCode: "",
        number: "",
      },
      terms: false,
    },
  });

  const onSubmit = async (values: SignUpData) => {
    setIsLoading(true);
    setError(null);
    const { confirmPassword, terms, ...userData } = values;
    try {
      const success = await auth.signup(userData);
      if (success) {
        navigate({to: "/profile"});
      }
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName.firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      placeholder="First name"
                      className="pl-10"
                      {...field}
                      aria-required="true"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fullName.lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      placeholder="Last name"
                      className="pl-10"
                      {...field}
                      aria-required="true"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      type="email"
                      placeholder="Email address"
                      className="pl-10"
                      {...field}
                      aria-required="true"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    <IntlTelInput
                      preferredCountries={["us", "in"]}
                      defaultCountry="in"
                      value={field.value.number}
                      placeholder="Phone number"
                      onPhoneNumberChange={(
                        _isValid,
                        value,
                        countryData
                      ) =>
                        field.onChange({
                          countryCode: `+${countryData.dialCode}`,
                          number: value,
                        })
                      }
                      containerClassName="intl-tel-input w-full"
                      inputClassName="form-control w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-none focus:border-blue-500 dark:border-gray-600 dark:bg-slate-950 dark:text-white dark:focus:border-primary-400"
                      aria-required="true"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <PasswordInput
                      placeholder="Password"
                      className="pl-10 pr-10"
                      {...field}
                      aria-required="true"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <PasswordInput
                      placeholder="Confirm password"
                      className="pl-10 pr-10"
                      {...field}
                      aria-required="true"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
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
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-primary">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-required="true"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I agree to the{" "}
                  <Link
                    to="/sign-up"
                    className="text-primary hover:text-primary/90"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/sign-up"
                    className="text-primary hover:text-primary/90"
                  >
                    Privacy Policy
                  </Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background text-muted-foreground px-2'>
              Or continue with
            </span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <Button
            variant='outline'
            className='w-full'
            type='button'
            disabled={isLoading}
          >
            <IconBrandGithub className='h-4 w-4' /> GitHub
          </Button>
          <Button
            variant='outline'
            className='w-full'
            type='button'
            disabled={isLoading}
          >
            <IconBrandFacebook className='h-4 w-4' /> Facebook
          </Button>
        </div>
      </form>
    </Form>
  )
}
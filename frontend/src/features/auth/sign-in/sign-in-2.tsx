import { UserAuthForm } from './components/user-auth-form'
import suggestMeLogo from '@/assets/suggestMeLogo.png'

export default function SignIn2() {
  return (
    <div className='relative container grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='bg-muted relative hidden h-full flex-col  text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900 h-full' />
        

        <img
          src={suggestMeLogo}
          className='relative h-full object-cover'
          
          alt='Vite'
        />

      </div>
      <div className='lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[350px]'>
          <div className='flex flex-col space-y-2 text-left'>
            <h1 className='text-2xl font-semibold tracking-tight'>Login</h1>
            <p className='text-muted-foreground text-sm'>
              Enter your email and password below <br />
              to log into your account
            </p>
          </div>
          <UserAuthForm />
          <p className='text-muted-foreground px-8 text-center text-sm'>
            By clicking login, you agree to our{' '}
            <a
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

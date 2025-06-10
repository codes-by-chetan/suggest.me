/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import AuthService from '@/services/auth.service'
import UserService from '@/services/user.service'
import { AuthUser } from '@/interfaces/auth.interfaces'

interface AuthState {
  auth: {
    user: AuthUser | null
    isAuthenticated: boolean
    isLoading: boolean
    setUser: (user: AuthUser | null) => void
    setLoading: (loading: boolean) => void
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
    logout: () => Promise<void>
    checkAuth: () => Promise<void>
    reset: () => void
  }
}

const authService = new AuthService()
const userService = new UserService()

export const useAuthStore = create<AuthState>()((
  persist(
    (set, get) => ({
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        setUser: (user) =>
          set((state) => ({ 
            ...state, 
            auth: { 
              ...state.auth, 
              user,
              isAuthenticated: !!user 
            } 
          })),
        setLoading: (loading) =>
          set((state) => ({ 
            ...state, 
            auth: { ...state.auth, isLoading: loading } 
          })),
        login: async (email: string, password: string) => {
          set((state) => ({ 
            ...state, 
            auth: { ...state.auth, isLoading: true } 
          }))
          
          try {
            const response = await authService.login({ email, password })
            
            if (response.success && response.data) {
              const { user } = response.data
              set((state) => ({ 
                ...state, 
                auth: { 
                  ...state.auth, 
                  user,
                  isAuthenticated: true,
                  isLoading: false 
                } 
              }))
              return { success: true, message: 'Login successful' }
            } else {
              set((state) => ({ 
                ...state, 
                auth: { ...state.auth, isLoading: false } 
              }))
              return { success: false, message: response.message || 'Login failed' }
            }
          } catch (error) {
            set((state) => ({ 
              ...state, 
              auth: { ...state.auth, isLoading: false } 
            }))
            return { success: false, message: 'Network error' }
          }
        },
        logout: async () => {
          try {
            await authService.logout()
          } catch (error) {
            console.error('Logout error:', error)
          } finally {
            set((state) => ({ 
              ...state, 
              auth: { 
                ...state.auth, 
                user: null, 
                isAuthenticated: false,
                isLoading: false 
              } 
            }))
          }
        },
        checkAuth: async () => {
          const token = authService.getToken()
          if (!token) {
            set((state) => ({ 
              ...state, 
              auth: { 
                ...state.auth, 
                user: null, 
                isAuthenticated: false,
                isLoading: false 
              } 
            }))
            return
          }

          set((state) => ({ 
            ...state, 
            auth: { ...state.auth, isLoading: true } 
          }))

          try {
            const verifyResponse = await authService.verifyToken()
            if (verifyResponse.success) {
              // Get user profile
              const profileResponse = await userService.getUserProfile()
              if (profileResponse.success && profileResponse.data) {
                const user = profileResponse.data.user as AuthUser
                set((state) => ({ 
                  ...state, 
                  auth: { 
                    ...state.auth, 
                    user,
                    isAuthenticated: true,
                    isLoading: false 
                  } 
                }))
              } else {
                throw new Error('Failed to get user profile')
              }
            } else {
              throw new Error('Token verification failed')
            }
          } catch (error) {
            console.error('Auth check failed:', error)
            localStorage.removeItem('token')
            set((state) => ({ 
              ...state, 
              auth: { 
                ...state.auth, 
                user: null, 
                isAuthenticated: false,
                isLoading: false 
              } 
            }))
          }
        },
        reset: () =>
          set((state) => ({
            ...state,
            auth: { 
              ...state.auth, 
              user: null, 
              isAuthenticated: false,
              isLoading: false 
            },
          })),
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        auth: { 
          user: state.auth.user,
          isAuthenticated: state.auth.isAuthenticated 
        } 
      }),
    }
  )
))

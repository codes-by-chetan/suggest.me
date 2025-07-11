"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface AuthDialogState {
  isOpen: boolean
  redirectTo: string
  defaultTab: "login" | "signup"
  isProtectedRoute: boolean
  previousRoute?: string
}

interface AuthDialogContextType {
  authDialog: AuthDialogState
  showAuthDialog: (
    redirectTo: string,
    defaultTab?: "login" | "signup",
    isProtected?: boolean,
    previousRoute?: string,
  ) => void
  hideAuthDialog: () => void
}

const AuthDialogContext = createContext<AuthDialogContextType | null>(null)

export const useAuthDialog = () => {
  const context = useContext(AuthDialogContext)
  if (!context) {
    throw new Error("useAuthDialog must be used within AuthDialogProvider")
  }
  return context
}

export const AuthDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authDialog, setAuthDialog] = useState<AuthDialogState>({
    isOpen: false,
    redirectTo: "/",
    defaultTab: "login",
    isProtectedRoute: false,
    previousRoute: undefined,
  })

  const showAuthDialog = (
    redirectTo: string,
    defaultTab: "login" | "signup" = "login",
    isProtected = false,
    previousRoute?: string,
  ) => {
    setAuthDialog({
      isOpen: true,
      redirectTo,
      defaultTab,
      isProtectedRoute: isProtected,
      previousRoute,
    })
  }

  const hideAuthDialog = () => {
    setAuthDialog((prev) => ({ ...prev, isOpen: false }))
  }

  return (
    <AuthDialogContext.Provider
      value={{
        authDialog,
        showAuthDialog,
        hideAuthDialog,
      }}
    >
      {children}
    </AuthDialogContext.Provider>
  )
}

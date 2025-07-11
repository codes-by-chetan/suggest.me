import { isProtectedRoute } from "@/config/route-config"
import { useAuth } from "@/context/auth-context"
import { useAuthDialog } from "@/context/auth-dialog-context"
import { useLocation } from "@tanstack/react-router"
import type React from "react"
import { useEffect, useRef } from "react"


interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const { showAuthDialog, hideAuthDialog, authDialog } = useAuthDialog()
  const location = useLocation()
  const currentPath = location.pathname
  const isProtected = isProtectedRoute(currentPath)

  // Track previous route for navigation
  const previousRoute = useRef<string>("/")
  const hasShownDialogForCurrentRoute = useRef<boolean>(false)

  // Update previous route tracking when location changes
  useEffect(() => {
    // Store the current path as previous when we're about to leave it
    return () => {
      if (currentPath !== "/" && !isProtectedRoute(currentPath)) {
        previousRoute.current = currentPath
      }
    }
  }, [currentPath])

  // Reset dialog tracking when route changes
  useEffect(() => {
    hasShownDialogForCurrentRoute.current = false
  }, [currentPath])

  // Reset dialog tracking when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      hasShownDialogForCurrentRoute.current = false
      // Close dialog if user just authenticated
      if (authDialog.isOpen) {
        hideAuthDialog()
      }
    }
  }, [isAuthenticated, authDialog.isOpen, hideAuthDialog])

  useEffect(() => {
    // Don't show dialog if already shown for this route in this session
    if (hasShownDialogForCurrentRoute.current) {
      return
    }

    // Don't show dialog if already open
    if (authDialog.isOpen) {
      return
    }

    // For protected routes: always show dialog if not authenticated
    if (isProtected && !isAuthenticated) {
      hasShownDialogForCurrentRoute.current = true
      showAuthDialog(currentPath, "login", true, previousRoute.current)
      return
    }

    // For unprotected routes: show dialog if not authenticated (user can dismiss)
    if (!isProtected && !isAuthenticated) {
      hasShownDialogForCurrentRoute.current = true
      showAuthDialog(currentPath, "login", false, previousRoute.current)
      return
    }
  }, [isAuthenticated, currentPath, isProtected, showAuthDialog, authDialog.isOpen])

  // For protected routes, don't render children if not authenticated
  if (isProtected && !isAuthenticated) {
    return null
  }

  // For unprotected routes, always render children
  return <>{children}</>
}

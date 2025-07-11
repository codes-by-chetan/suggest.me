import type React from "react"

export interface RouteConfig {
  path: string
  protected: boolean
  component: React.ComponentType
}

export const routeConfig = {
  "/": { protected: false },
  "/search": { protected: false },
  "/suggested-to-me": { protected: true },
  "/my-suggestions": { protected: true },
  "/my-watchlist": { protected: true },
  "/notifications": { protected: true },
  "/chat": { protected: true },
  "/profile": { protected: true },
  "/edit-profile": { protected: true },
  "/settings": { protected: true },
} as const

export const isProtectedRoute = (path: string): boolean => {
  // Check exact match first
  if (routeConfig[path as keyof typeof routeConfig]) {
    return routeConfig[path as keyof typeof routeConfig].protected
  }

  // Check for dynamic routes
  if (path.startsWith("/profile/")) return true
  if (path.startsWith("/chat/")) return true
  if (path.startsWith("/suggested-to-me/")) return true

  return false
}

export const getLastUnprotectedRoute = (routes: string[]): string => {
  // Find the last unprotected route from a list of routes
  for (let i = routes.length - 1; i >= 0; i--) {
    if (!isProtectedRoute(routes[i])) {
      return routes[i]
    }
  }
  return "/" // fallback to home
}

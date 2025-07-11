"use client"

import { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768

export function useMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Set initial value
    setIsMobile(window.innerWidth < breakpoint)

    // Add event listener
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    window.addEventListener("resize", handleResize)

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [breakpoint])

  return isMobile
}

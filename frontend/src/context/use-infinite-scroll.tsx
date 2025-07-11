"use client"

import { useRef, useEffect, useCallback } from "react"

export function useInfiniteScroll(callback: () => void, options = {}) {
  const observerRef = useRef<HTMLDivElement>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting) {
        callback()
      }
    },
    [callback],
  )

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "200px",
      threshold: 0.1,
      ...options,
    })

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current)
      }
    }
  }, [handleObserver, options])

  return { observerRef }
}

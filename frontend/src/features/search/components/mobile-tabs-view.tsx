"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import type { TabType } from "./search-page"
import { cn } from "@/lib/utils"

interface MobileTabsViewProps {
  tabs: TabType[]
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MobileTabsView({ tabs, activeTab, setActiveTab }: MobileTabsViewProps) {
  const [startX, setStartX] = useState<number | null>(null)
  const [currentX, setCurrentX] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX !== null) {
      setCurrentX(e.touches[0].clientX)
    }
  }

  const handleTouchEnd = () => {
    if (startX !== null && currentX !== null) {
      const diff = startX - currentX
      const threshold = 50 // Minimum swipe distance

      if (Math.abs(diff) > threshold) {
        const currentIndex = tabs.findIndex((tab) => tab.value === activeTab)

        if (diff > 0 && currentIndex < tabs.length - 1) {
          // Swipe left -> next tab
          setActiveTab(tabs[currentIndex + 1].value)
        } else if (diff < 0 && currentIndex > 0) {
          // Swipe right -> previous tab
          setActiveTab(tabs[currentIndex - 1].value)
        }
      }
    }

    // Reset values
    setStartX(null)
    setCurrentX(null)
  }

  // Alternative swipe implementation using framer-motion
  const handleSwipe = (offset: number) => {
    const currentIndex = tabs.findIndex((tab) => tab.value === activeTab)
    const swipeThreshold = 50

    if (offset < -swipeThreshold && currentIndex < tabs.length - 1) {
      // Swipe left -> next tab
      setActiveTab(tabs[currentIndex + 1].value)
    } else if (offset > swipeThreshold && currentIndex > 0) {
      // Swipe right -> previous tab
      setActiveTab(tabs[currentIndex - 1].value)
    }
  }

  return (
    <div className="relative mb-4 overflow-hidden">
      {/* Swipe Overlay */}
      <motion.div
        className="absolute inset-0 z-10"
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, { offset }) => handleSwipe(offset.x)}
      />

      {/* Tab Indicators */}
      <div className="flex justify-center gap-1 mb-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              activeTab === tab.value ? "bg-primary" : "bg-muted",
            )}
            aria-label={`Switch to ${tab.label} tab`}
          />
        ))}
      </div>

      {/* Current Tab Label */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="text-center font-medium mb-2"
      >
        {tabs.find((tab) => tab.value === activeTab)?.label}
      </motion.div>
    </div>
  )
}

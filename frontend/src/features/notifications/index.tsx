import { useState, useEffect, useRef } from "react"
import { useNotifications } from "@/lib/notification-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Bell, Users, Lightbulb, MoreHorizontal } from "lucide-react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { subDays, isAfter } from "date-fns"
import NotificationItem2 from "@/components/layout/NotificationItem-2"
import AuthenticationFallback from "@/components/layout/AuthenticationFallback"
import { useAuth } from "@/lib/auth-context"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  read: boolean
  contentType?: string
  user?: {
    id: string
    fullName: {
      firstName: string
      lastName: string
      _id: string
      [key: string]: any
    }
    avatar: string
    fullNameString: string
  }
  metadata: {
    followRequestStatus: string
    followRequestId: string
    _id: string
    id: string
    [key: string]: any
  }
}

const NotificationsPage = () => {
  const { isAuthenticated } = useAuth()
  const { notifications, markAsRead, dismiss } = useNotifications()
  console.log(notifications);
  
  const [activeTab, setActiveTab] = useState("followRequests")
  const [currentPage, setCurrentPage] = useState({
    followRequests: 1,
    suggestions: 1,
    others: 1,
  })
  const [dateFilter, setDateFilter] = useState("all")
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const notificationsPerPage = 10
  const containerRef = useRef<HTMLDivElement>(null)

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Reset pages when filter changes
  useEffect(() => {
    setCurrentPage({ followRequests: 1, suggestions: 1, others: 1 })
  }, [dateFilter])

  // Apply date filter
  function applyDateFilter(createdAt: string) {
    const notificationDate = new Date(createdAt)
    if (dateFilter === "today") {
      return notificationDate.toDateString() === new Date().toDateString()
    } else if (dateFilter === "week") {
      return isAfter(notificationDate, subDays(new Date(), 7))
    } else if (dateFilter === "month") {
      return isAfter(notificationDate, subDays(new Date(), 30))
    }
    return true // "all"
  }

  // Categorize and filter notifications
  const followRequests = notifications.filter((n) => n.type === "FollowRequest" && applyDateFilter(n.createdAt))
  const suggestions = notifications.filter((n) => n.type === "Suggestion" && applyDateFilter(n.createdAt))
  const others = notifications.filter(
    (n) => !["FollowRequest", "Suggestion"].includes(n.type) && applyDateFilter(n.createdAt),
  )

  // Pagination logic for each category
  const getPaginatedNotifications = (categoryNotifications: any[], page: number) => {
    const startIndex = (page - 1) * notificationsPerPage
    return categoryNotifications.slice(startIndex, startIndex + notificationsPerPage)
  }

  const totalPages = {
    followRequests: Math.ceil(followRequests.length / notificationsPerPage),
    suggestions: Math.ceil(suggestions.length / notificationsPerPage),
    others: Math.ceil(others.length / notificationsPerPage),
  }

  // Handle swipe gestures
  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50
    const velocity = info.velocity.x

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      if (info.offset.x > 0 || velocity > 0) {
        // Swipe right - go to previous tab
        if (activeTab === "suggestions") {
          setActiveTab("followRequests")
        } else if (activeTab === "others") {
          setActiveTab("suggestions")
        }
      } else {
        // Swipe left - go to next tab
        if (activeTab === "followRequests") {
          setActiveTab("suggestions")
        } else if (activeTab === "suggestions") {
          setActiveTab("others")
        }
      }
    }
  }

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  const renderNotificationList = (
    categoryNotifications: any[],
    category: "followRequests" | "suggestions" | "others",
    emptyMessage: string,
  ) => (
    <div className="space-y-4">
      {categoryNotifications.length > 0 ? (
        getPaginatedNotifications(categoryNotifications, currentPage[category]).map((notification) => (
          <div key={notification._id} className="flex items-center gap-2">
            <NotificationItem2
              notification={{
                id: notification._id,
                type: notification.type,
                title:
                  category === "followRequests"
                    ? "Follow Request"
                    : category === "suggestions"
                      ? "New Suggestion"
                      : notification.type === "Like"
                        ? "New Like"
                        : notification.type === "Comment"
                          ? "New Comment"
                          : notification.type === "System"
                            ? "System Notification"
                            : notification.type === "FollowAccepted"
                              ? "Follow Accepted"
                              : notification.type === "FollowedYou"
                                ? "Followed You"
                                : notification.type === "NewContent"
                                  ? "New Content"
                                  : notification.type === "Mention"
                                    ? "Mention"
                                    : "Notification",
                message: notification.message,
                timestamp: notification.createdAt,
                read: notification.status === "Read",
                contentType: notification.relatedContent?.contentType,
                user: notification.sender
                  ? {
                      id: notification.sender._id,
                      fullName: notification.sender.fullName,
                      fullNameString:
                        notification.sender.fullNameString ||
                        `${notification.sender.fullName.firstName} ${notification.sender.fullName.lastName}`,
                      avatar: notification.sender.avatar?.url || notification.sender?.profile?.avatar?.url || null,
                      isVerified: notification.sender.isVerified || notification.sender?.profile?.isVerified || false,
                    }
                  : undefined,
                metadata: notification.metadata,
                ...notification,
              }}
              onMarkAsRead={() => markAsRead(notification._id)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => dismiss(notification._id)}>
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        ))
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Bell className="h-8 w-8" />
          </div>
          <p className="text-sm">{emptyMessage}</p>
        </div>
      )}
      {totalPages[category] > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage[category] === 1}
            onClick={() =>
              setCurrentPage((prev) => ({
                ...prev,
                [category]: prev[category] - 1,
              }))
            }
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage[category]} of {totalPages[category]}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage[category] === totalPages[category]}
            onClick={() =>
              setCurrentPage((prev) => ({
                ...prev,
                [category]: prev[category] + 1,
              }))
            }
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthenticationFallback
        title="Please Sign In"
        description="Sign in or create an account to view your notifications, follow requests, and stay updated with your friends' activities."
        icon={<Bell className="h-10 w-10 text-primary" />}
      />
    )
  }

  return (
    <main className="w-full mx-auto pb-[10vh] pt-0 px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isMobile ? (
          // Mobile Tabbed Interface
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="followRequests" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Follow Requests</span>
                <span className="sm:hidden text-xs">Follow Requests</span>
                {followRequests.length > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                    {followRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Suggestions</span>
                <span className="sm:hidden text-xs">Suggestions</span>
                {suggestions.length > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                    {suggestions.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="others" className="flex items-center gap-2">
                <MoreHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Others</span>
                <span className="sm:hidden text-xs">Others</span>
                {others.length > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                    {others.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div ref={containerRef} className="relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  className="w-full"
                >
                  <TabsContent value="followRequests" className="mt-0 min-h-[calc(100vh-400px)]">
                    {renderNotificationList(followRequests, "followRequests", "No follow requests")}
                  </TabsContent>
                  <TabsContent value="suggestions" className="mt-0 min-h-[calc(100vh-200px)]">
                    {renderNotificationList(suggestions, "suggestions", "No suggestions")}
                  </TabsContent>
                  <TabsContent value="others" className="mt-0 min-h-[calc(100vh-200px)]">
                    {renderNotificationList(others, "others", "No other notifications")}
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Swipe indicator */}
            {/* <div className="flex justify-center mt-4">
              <div className="flex space-x-2">
                {["followRequests", "suggestions", "others"].map((tab, index) => (
                  <div
                    key={tab}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      activeTab === tab ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div> */}
          </Tabs>
        ) : (
          // Desktop Grid Layout (unchanged)
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Follow Requests Column */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Follow Requests
                {followRequests.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                    {followRequests.length}
                  </span>
                )}
              </h2>
              <Separator />
              {renderNotificationList(followRequests, "followRequests", "No follow requests")}
            </motion.div>

            {/* Suggestions Column */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Suggestions
                {suggestions.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                    {suggestions.length}
                  </span>
                )}
              </h2>
              <Separator />
              {renderNotificationList(suggestions, "suggestions", "No suggestions")}
            </motion.div>

            {/* Others Column */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MoreHorizontal className="h-5 w-5" />
                Others
                {others.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                    {others.length}
                  </span>
                )}
              </h2>
              <Separator />
              {renderNotificationList(others, "others", "No other notifications")}
            </motion.div>
          </div>
        )}
      </div>
    </main>
  )
}

export default NotificationsPage

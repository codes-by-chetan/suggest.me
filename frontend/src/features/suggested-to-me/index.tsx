import { useState, useEffect, useRef } from "react"
import { CustomTabsList } from "@/components/layout/CustomTabsList"
import SuggestedToMeCard from "@/components/layout/SuggestedToMeCard"
import AuthenticationFallback from "@/components/layout/AuthenticationFallback"
import { getSuggestedToYou } from "@/services/suggestion.service"
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react"
import CommentBox from "@/components/reusables/CommentBox"
import { toast } from "@/services/toast.service"
import { Heart } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface ContentItem {
  id: string
  contentId?: string
  title: string
  type: string
  imageUrl?: string
  year?: string
  creator?: string
  description?: string
  suggestedBy: {
    id: string
    name: string
    avatar?: string
  }
  suggestedAt: string
  whereToWatch?: string[]
  whereToRead?: string[]
  whereToListen?: string[]
  [key: string]: any
}

interface Position {
  top: number
  left: number
}

const SuggestedToMe = () => {
  const { isAuthenticated } = useAuth()

  const [activeTab, setActiveTab] = useState("all")
  const [suggestions, setSuggestions] = useState<ContentItem[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 12

  // Global state for shared emoji picker and comment box
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [emojiPickerPosition, setEmojiPickerPosition] = useState<Position>({
    top: 0,
    left: 0,
  })
  const [commentBoxPosition, setCommentBoxPosition] = useState<Position>({
    top: 0,
    left: 0,
  })
  const [cardReactions, setCardReactions] = useState<Record<string, string[]>>({})

  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const commentBoxRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions on component mount or page/tab change
  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const res = await getSuggestedToYou({
          page,
          limit,
          type: activeTab === "all" ? undefined : activeTab,
        })
        if (res.success) {
          setSuggestions(res.data)
          setTotalPages(Math.ceil(res.total / limit))
        } else {
          setSuggestions([])
          toast.error("Failed to fetch suggestions!")
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setSuggestions([])
        toast.error("Something went wrong while fetching suggestions!")
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated) fetchSuggestions()
  }, [activeTab, page, isAuthenticated])

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthenticationFallback
        title="Please Sign In"
        description="Sign in or create an account to view personalized suggestions from your friends and discover amazing content recommendations."
        icon={<Heart className="h-10 w-10 text-primary" />}
      />
    )
  }

  // Filter suggestions when tab or suggestions change
  useEffect(() => {
    setFilteredSuggestions(activeTab === "all" ? suggestions : suggestions.filter((item) => item.type === activeTab))
  }, [activeTab, suggestions])

  // Close emoji picker and comment box when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (showCommentBox && commentBoxRef.current && !commentBoxRef.current.contains(event.target as Node)) {
        setShowCommentBox(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showEmojiPicker, showCommentBox])

  // Handle emoji selection
  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    if (activeCardId) {
      setCardReactions((prev) => ({
        ...prev,
        [activeCardId]: [emojiData.emoji],
      }))
      setShowEmojiPicker(false)
      toast.success("Reaction added!")
    }
  }

  // Handle comment submission
  const handleCommentSubmit = (comment: string) => {
    console.log(`Comment for card ${activeCardId}: ${comment}`)
    setShowCommentBox(false)
    toast.success("Comment added!")
  }

  // Handle emoji picker toggle
  const handleToggleEmojiPicker = (cardId: string, position: Position) => {
    setActiveCardId(cardId)
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    let top = position.top
    const emojiPickerHeight = 400
    if (top + emojiPickerHeight > viewportHeight) {
      top = position.top - emojiPickerHeight - 10
    }
    let left = position.left
    const emojiPickerWidth = 300
    if (left + emojiPickerWidth > viewportWidth) {
      left = viewportWidth - emojiPickerWidth - 20
    }
    setEmojiPickerPosition({ top, left })
    setShowEmojiPicker((prev) => !prev)
    setShowCommentBox(false)
  }

  // Handle comment box toggle
  const handleToggleCommentBox = (cardId: string, position: Position) => {
    setActiveCardId(cardId)
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    let top = position.top
    const commentBoxHeight = 200
    if (top + commentBoxHeight > viewportHeight) {
      top = position.top - commentBoxHeight - 10
    }
    let left = position.left
    const commentBoxWidth = 300
    if (left + commentBoxWidth > viewportWidth) {
      left = viewportWidth - commentBoxWidth - 20
    }
    setCommentBoxPosition({ top, left })
    setShowCommentBox((prev) => !prev)
    setShowEmojiPicker(false)
  }

  return (
    <main className="w-full mx-auto pt-0 pb-[10vh] px-4 sm:px-6 lg:px-8 relative">
      <div className="py-6">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          <span className="text-primary">Suggested</span> to Me
        </h1>
        <CustomTabsList
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          CustomCard={SuggestedToMeCard}
          filteredSuggestions={filteredSuggestions}
          isLoading={isLoading}
          onToggleEmojiPicker={handleToggleEmojiPicker}
          onToggleCommentBox={handleToggleCommentBox}
          cardReactions={cardReactions}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
        />
      </div>
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="fixed z-[1000]"
          style={{
            top: `${emojiPickerPosition.top}px`,
            left: `${emojiPickerPosition.left}px`,
          }}
        >
          <EmojiPicker onEmojiClick={handleEmojiSelect} width={300} height={400} />
        </div>
      )}
      {showCommentBox && (
        <div
          ref={commentBoxRef}
          className="fixed z-[1000] bg-background border border-border rounded-lg shadow-lg w-80"
          style={{
            top: `${commentBoxPosition.top}px`,
            left: `${commentBoxPosition.left}px`,
          }}
        >
          <CommentBox onSubmit={handleCommentSubmit} />
        </div>
      )}
    </main>
  )
}

export default SuggestedToMe

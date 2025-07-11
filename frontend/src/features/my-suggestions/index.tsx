import { useEffect, useState } from "react"
import { Plus, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import SuggestionFlow from "@/components/suggestions/SuggestionFlow"
import { CustomTabsList } from "@/components/layout/CustomTabsList"
import AuthenticationFallback from "@/components/layout/AuthenticationFallback"
import { getSuggestedByYou, suggestContent } from "@/services/suggestion.service"
import { toast } from "@/services/toast.service"
import type { ContentItem } from "@/interfaces/content.interfaces"
import MySuggestionCard from "@/components/layout/MySuggestion"
import { useAuth } from "@/lib/auth-context"

const MySuggestions = () => {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("all")
  const [isSuggestionFlowOpen, setIsSuggestionFlowOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<ContentItem[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 12

  const fetchSuggestions = async (currentPage: number, type?: string) => {
    setIsLoading(true)
    try {
      const res = await getSuggestedByYou({
        page: currentPage,
        limit,
        type: type === "all" ? undefined : type,
      })
      if (res.success) {
        setSuggestions(res.data)
        setTotalPages(Math.ceil(res.total / res.limit))
      } else {
        toast.error("Failed to fetch suggestions!")
        setSuggestions([])
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      toast.error("Something went wrong while fetching suggestions!")
      setSuggestions([])
    } finally {
      setTimeout(() => {
        setIsLoading(false)
      }, 800)
    }
  }

  const handleSuggestionComplete = async (data: any) => {
    setIsLoading(true)
    try {
      const res = await suggestContent(data)
      console.log("Suggestion response:", res)
      if (res.success) {
        toast.success("Suggestion added successfully!")
      } else {
        toast.error("Failed to add suggestion!")
      }
    } catch (error) {
      toast.error("Something went wrong while adding suggestion!")
    }
    await fetchSuggestions(1, activeTab)
    setPage(1)
    setIsSuggestionFlowOpen(false)
  }

  useEffect(() => {
    console.log(isAuthenticated)
    if (isAuthenticated) {
      fetchSuggestions(page, activeTab)
    }
  }, [page, activeTab, isAuthenticated])

  useEffect(() => {
    setFilteredSuggestions(suggestions)
  }, [suggestions])

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthenticationFallback
        title="Please Sign In"
        description="Sign in or create an account to create and manage your content suggestions. Share your favorite movies, books, music, and more with friends!"
        icon={<Lightbulb className="h-10 w-10 text-primary" />}
      />
    )
  }

  return (
    <main className="w-full mx-auto pb-[10vh] pt-0 px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            My <span className="text-primary">Suggestions</span>
          </h1>
          <Button onClick={() => setIsSuggestionFlowOpen(true)} className="rounded-full gap-2">
            <Plus className="h-4 w-4" />
            New Suggestion
          </Button>
        </div>

        <CustomTabsList
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filteredSuggestions={filteredSuggestions}
          CustomCard={MySuggestionCard}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          onToggleCommentBox={() => {}}
          onToggleEmojiPicker={() => {}}
        />
        <SuggestionFlow
          open={isSuggestionFlowOpen}
          onOpenChange={setIsSuggestionFlowOpen}
          onComplete={handleSuggestionComplete}
        />
      </div>
    </main>
  )
}

export default MySuggestions

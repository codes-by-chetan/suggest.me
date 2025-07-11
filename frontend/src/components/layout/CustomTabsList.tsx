/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Film, BookOpen, Music, Youtube, Plus, Clapperboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"
import type { Dispatch, SetStateAction } from "react"
import SuggestionPlaceholderCard from "./SuggestionPlaceholderCard"

interface CustomTabsListProps {
  activeTab: string
  setActiveTab: Dispatch<SetStateAction<string>>
  filteredSuggestions: any[]
  CustomCard: any
  isLoading?: boolean
  onToggleEmojiPicker?: (id: string, position: { top: number; left: number }) => void
  onToggleCommentBox?: (id: string, position: { top: number; left: number }) => void
  cardReactions?: Record<string, string[]>
  page?: number
  totalPages?: number
  setPage?: Dispatch<SetStateAction<number>>
}

export const CustomTabsList = ({
  activeTab,
  setActiveTab,
  filteredSuggestions,
  CustomCard,
  isLoading = false,
  onToggleEmojiPicker,
  onToggleCommentBox,
  cardReactions,
  page = 1,
  totalPages = 1,
  setPage,
}: CustomTabsListProps) => {
  const tabs = [
    { value: "all", label: "All" },
    { value: "movie", label: "Movies", icon: Film },
    { value: "series", label: "Series", icon: Clapperboard },
    { value: "book", label: "Books", icon: BookOpen },
    { value: "music", label: "Music", icon: Music },
    { value: "video", label: "Videos", icon: Youtube },
  ]

  const skeletonPlaceholders = Array(6)
    .fill(0)
    .map((_, index) => <SuggestionPlaceholderCard key={`skeleton-${index}`} />)

  return (
    <Tabs
      defaultValue="all"
      value={activeTab}
      onValueChange={(value) => {
        setActiveTab(value)
        if (setPage) setPage(1)
      }}
      className="w-full"
    >
      {/* Mobile tabs - horizontal scroll */}
      <div className="block sm:hidden mb-6 max-w-[calc(100vw-35px)]">
        <TabsList className="flex w-full overflow-x-auto p-1 bg-slate-200/60 dark:bg-muted/50 rounded-full">
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-1.5 rounded-full whitespace-nowrap px-3 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:dark:bg-primary-900"
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span className="hidden min-[470px]:inline">{label}</span>
              <span className="min-[470px]:hidden">{Icon ? "" : label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Desktop tabs - grid layout */}
      <div className="hidden sm:block mb-8">
        <TabsList className="grid grid-cols-6 p-1 bg-slate-200/60 dark:bg-muted/50 rounded-full">
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:dark:bg-primary-900"
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span className="hidden md:inline">{label}</span>
              <span className="md:hidden">{Icon ? "" : label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value={activeTab} className="mt-0">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 min-[470px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 min-[470px]:gap-3 sm:gap-4 lg:gap-6"
          >
            {isLoading ? (
              skeletonPlaceholders
            ) : filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CustomCard
                    item={item}
                    onToggleEmojiPicker={onToggleEmojiPicker}
                    onToggleCommentBox={onToggleCommentBox}
                    cardReactions={cardReactions}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="col-span-full text-center py-12 bg-card rounded-lg shadow-sm border border-border/50 p-6 sm:p-8"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-4">
                  <Film className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">No suggestions yet</h3>
                <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-6">
                  You don't have any suggestions in this category yet. Ask your friends to recommend something!
                </p>
                <Button className="rounded-full gap-2">
                  <Plus className="h-4 w-4" />
                  Ask for Recommendations
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {page && totalPages && setPage && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              className="rounded-full w-full sm:w-auto"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              className="rounded-full w-full sm:w-auto"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

export default CustomTabsList

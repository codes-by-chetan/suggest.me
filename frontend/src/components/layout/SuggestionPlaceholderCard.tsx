import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

export default function SuggestionPlaceholderCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden shadow-social max-w-[calc(100vw-35px)] dark:shadow-social-dark border-0">
        <div className="flex flex-col h-full relative">
          <div className="w-full h-40 bg-muted/60 animate-pulse" />
          <CardContent className="flex-1 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-full w-8 h-8 animate-pulse" />
                <div className="h-4 w-16 bg-muted/60 rounded-full animate-pulse" />
              </div>
              <div className="h-4 w-24 bg-muted/60 rounded-full animate-pulse" />
            </div>
            <div className="h-6 w-3/4 bg-muted/60 rounded-full mb-2 animate-pulse" />
            <div className="h-4 w-1/2 bg-muted/60 rounded-full mb-4 animate-pulse" />
            <div className="h-4 w-full bg-muted/60 rounded-full mb-2 animate-pulse" />
            <div className="h-4 w-5/6 bg-muted/60 rounded-full mb-6 animate-pulse" />

            {/* Action buttons skeleton */}
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="h-8 w-full bg-muted/60 rounded-full animate-pulse" />
              <div className="h-8 w-full bg-muted/60 rounded-full animate-pulse" />
              <div className="h-8 w-full bg-muted/60 rounded-full animate-pulse" />
            </div>

            {/* Social buttons skeleton */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-8 w-8 bg-muted/60 rounded-full animate-pulse" />
              <div className="h-8 w-8 bg-muted/60 rounded-full animate-pulse" />
              <div className="h-8 w-8 bg-muted/60 rounded-full animate-pulse" />
            </div>

            <div className="flex items-center pt-3 border-t border-border">
              <div className="h-4 w-24 bg-muted/60 rounded-full mr-2 animate-pulse" />
              <div className="flex items-center">
                <div className="h-5 w-5 bg-muted/60 rounded-full mr-1 animate-pulse" />
                <div className="h-4 w-20 bg-muted/60 rounded-full animate-pulse" />
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  )
}

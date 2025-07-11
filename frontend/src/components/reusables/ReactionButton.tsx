import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SmilePlus } from "lucide-react"
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react"
import { motion } from "framer-motion"

interface ReactionButtonProps {
  onReactionSelect?: (emoji: string) => void
  reactions?: string[]
}

const ReactionButton: React.FC<ReactionButtonProps> = ({ onReactionSelect = () => {}, reactions = [] }) => {
  const [emojiPanel, setEmojiPanel] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setEmojiPanel(false)
      }
    }

    if (emojiPanel) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [emojiPanel])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onReactionSelect(emojiData.emoji)
    setEmojiPanel(false)
  }

  return (
    <div className="relative">
      <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full p-2 h-auto flex justify-center items-center"
          onClick={() => setEmojiPanel(!emojiPanel)}
        >
          {reactions.length > 0 ? (
            <div className="flex gap-2">
              <div className="flex justify-center items-center">
                {reactions.map((emoji, index) => (
                  <span key={index} className="text-sm">
                    {emoji}
                  </span>
                ))}
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
                <SmilePlus size={15} />
              </div>
            </div>
          ) : (
            <SmilePlus className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </motion.div>

      {emojiPanel && (
        <div ref={emojiPickerRef} className="absolute bottom-10 left-0 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
        </div>
      )}
    </div>
  )
}

export default ReactionButton

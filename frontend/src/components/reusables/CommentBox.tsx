import { useState, useRef, useEffect } from "react"
import { Smile } from "lucide-react"
import { Button } from "../ui/button"
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react"

interface CommentBoxProps {
  onSubmit?: (comment: string) => void
}

const CommentBox = ({ onSubmit = () => {} }: CommentBoxProps) => {
  const [comment, setComment] = useState("")
  const [openEmojiPicker, setOpenEmojiPicker] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setOpenEmojiPicker(false)
      }
    }

    if (openEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openEmojiPicker])

  // Handle emoji selection
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setComment((prev) => prev + emojiData.emoji)
    setOpenEmojiPicker(false)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  // Handle comment submission
  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment)
      setComment("")
    }
  }

  return (
    <div className="p-4 w-full">
      <h3 className="text-lg font-semibold mb-3">Add a comment</h3>
      <div className="relative w-full">
        <div className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            className="w-full p-3 border border-input rounded-md min-h-[100px] bg-background text-foreground resize-none"
            placeholder="Write your comment here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex justify-between items-center">
            <button
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
              onClick={() => setOpenEmojiPicker(!openEmojiPicker)}
              type="button"
            >
              <Smile className="h-5 w-5" />
            </button>

            <Button size="sm" onClick={handleSubmit} disabled={!comment.trim()} className="px-4">
              Submit
            </Button>
          </div>
        </div>

        {openEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute z-[1001]"
            style={{
              bottom: "40px",
              right: "0",
              maxWidth: "100%",
            }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={280}
              height={350}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentBox

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Smile,
  PaperclipIcon,
  Image,
  Send,
  Mic,
  BookOpenCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import EmojiPicker from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ContentSearch from "@/components/suggestions/ContentSearch";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onSendSuggestion: (content: string, suggestion: any) => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendSuggestion,
  isLoading = false,
}) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [contentType, _setContentType] = useState("movie");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSelectContent = (content: any) => {
    setShowSuggestionDialog(false);
    const messageText = message.trim() ? message : "Check this out!";
    onSendSuggestion(messageText, {
      id: content.id,
      title: content.title,
      type: content.type,
      imageUrl: content.imageUrl,
      creator: content.creator,
      year: content.year,
    });
    setMessage("");
  };

  return (
    <div className="border-t border-border p-4 bg-card">
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            className="min-h-[60px] resize-none pr-10"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute right-3 bottom-3">
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full p-0 border-none shadow-lg"
                side="top"
                align="end"
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width="100%"
                  height={350}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setShowSuggestionDialog(true)}
          >
            <BookOpenCheck className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            disabled={isLoading}
          >
            <PaperclipIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            disabled={isLoading}
          >
            <Image className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            disabled={isLoading}
          >
            <Mic className="h-5 w-5" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className={cn(
              "rounded-full",
              !message.trim() && "opacity-50 cursor-not-allowed",
            )}
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Dialog
        open={showSuggestionDialog}
        onOpenChange={setShowSuggestionDialog}
      >
        <DialogContent className="sm:max-w-[600px]" aria-description="chat-input">
          <DialogHeader>
            <DialogTitle>Share a Suggestion</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ContentSearch
              contentType={contentType}
              onSelect={handleSelectContent}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatInput;
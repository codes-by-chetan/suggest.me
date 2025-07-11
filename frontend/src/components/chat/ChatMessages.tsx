import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Message } from "@/interfaces/chat.interfaces";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string;
  onLoadMore: () => void;
  hasMoreMessages: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  currentUserId,
  onLoadMore,
  hasMoreMessages,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Set up IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!hasMoreMessages || !topRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreMessages) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(topRef.current);

    return () => {
      if (observerRef.current && topRef.current) {
        observerRef.current.unobserve(topRef.current);
      }
    };
  }, [hasMoreMessages, onLoadMore]);

  const formatMessageTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "h:mm a");
    } catch (_error) {
      return "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getSenderAvatar = (fullName: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`;
  };

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  messages.forEach((message) => {
    const date = format(new Date(message.createdAt), "MMMM d, yyyy");
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <ScrollArea className="h-[calc(100vh-235px)] md:h-[calc(100vh-235px)] lg:h-[calc(100vh-235px)] px-4 py-2 overflow-y-auto">
      {/* Load More Button or Intersection Observer Target */}
      {hasMoreMessages && (
        <div ref={topRef} className="flex justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            className="text-muted-foreground"
          >
            Load More
          </Button>
        </div>
      )}

      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="mb-6">
          <div className="flex justify-center mb-4">
            <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
              {date}
            </span>
          </div>

          {dateMessages.map((message, index) => {
            const isCurrentUser = message.sender._id === currentUserId;
            const showAvatar =
              index === 0 ||
              dateMessages[index - 1].sender._id !== message.sender._id;

            return (
              <div
                key={message._id}
                className={cn(
                  "flex mb-4",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                {!isCurrentUser && showAvatar && (
                  <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                    <AvatarImage src={getSenderAvatar(message.sender.fullName)} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(message.sender.fullName)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "flex flex-col max-w-[70%]",
                    !isCurrentUser && !showAvatar && "ml-10"
                  )}
                >
                  {!isCurrentUser && showAvatar && (
                    <span className="text-xs text-muted-foreground mb-1">
                      {message.sender.fullName}
                    </span>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm",
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent"
                    )}
                  >
                    {message.content}
                  </div>

                  {/* Suggestion preview */}
                  {message.suggestion && (
                    <Card className="mt-2 overflow-hidden max-w-xs">
                      {message.suggestion.imageUrl && (
                        <div className="h-32 w-full overflow-hidden">
                          <img
                            src={message.suggestion.imageUrl}
                            alt={message.suggestion.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-3">
                        <div className="text-xs text-muted-foreground mb-1 uppercase">
                          {message.suggestion.type}
                        </div>
                        <h4 className="font-medium text-sm">
                          {message.suggestion.title}
                        </h4>
                        {message.suggestion.creator && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.suggestion.creator}{" "}
                            {message.suggestion.year &&
                              `• ${message.suggestion.year}`}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <span
                    className={cn(
                      "text-xs text-muted-foreground mt-1",
                      isCurrentUser ? "text-right" : "text-left"
                    )}
                  >
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div ref={scrollRef} />
    </ScrollArea>
  );
};

export default ChatMessages;
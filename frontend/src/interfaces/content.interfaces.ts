export interface ContentItem {
  id: string;
  userContentId: string;
  contentId: string;
  title: string;
  type: string;
  imageUrl?: string;
  year?: string;
  creator?: string;
  description?: string;
  suggestedBy?: { id: string; name: string; avatar?: string }; // For MyWatchListCard
  suggestedTo?: { id: string; name: string; avatar?: string }[]; // For MySuggestionCard
  addedAt?: string; // For MyWatchListCard
  suggestedAt?: string; // For MySuggestionCard
  status: "WantToConsume" | "Consuming" | "Consumed" | "NotInterested" | null;
  whereToWatch?: string[];
  whereToRead?: string[];
  whereToListen?: string[];
  [key: string]: any;
}

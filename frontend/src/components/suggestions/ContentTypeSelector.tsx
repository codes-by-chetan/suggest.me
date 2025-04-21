import React from "react";
import { cn } from "@/lib/utils";
import { Film, BookOpen, Tv, Music, Youtube, Instagram } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ContentType {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface ContentTypeSelectorProps {
  onSelect?: (contentType: string) => void;
  selectedType?: string;
}

const ContentTypeSelector = ({
  onSelect = () => {},
  selectedType = "",
}: ContentTypeSelectorProps) => {
  const contentTypes: ContentType[] = [
    {
      id: "movie",
      name: "Movies",
      icon: <Film className="h-8 w-8" />,
      description: "Suggest a film to watch",
    },
    {
      id: "book",
      name: "Books",
      icon: <BookOpen className="h-8 w-8" />,
      description: "Recommend a good read",
    },
    {
      id: "anime",
      name: "Anime",
      icon: <Tv className="h-8 w-8" />,
      description: "Share an anime series",
    },
    {
      id: "songs",
      name: "Songs",
      icon: <Music className="h-8 w-8" />,
      description: "Suggest a track to listen to",
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: <Youtube className="h-8 w-8" />,
      description: "Share a YouTube video",
    },
    {
      id: "reels",
      name: "Reels",
      icon: <Instagram className="h-8 w-8" />,
      description: "Suggest a short video",
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-muted p-4 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">
        What would you like to suggest?
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {contentTypes.map((type) => (
          <Card
            key={type.id}
            className={cn(
              "cursor-pointer transition-all hover:scale-105 border-2",
              selectedType === type.id
                ? "border-primary bg-primary/10"
                : "border-gray-600",
            )}
            onClick={() => onSelect(type.id)}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-2 p-2 rounded-full bg-primary/10">
                {type.icon}
              </div>
              <h3 className="font-semibold text-lg">{type.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{type.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContentTypeSelector;

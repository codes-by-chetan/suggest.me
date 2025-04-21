import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ContentItem {
  id: string;
  title: string;
  type: "movie" | "book" | "anime" | "song" | "video";
  imageUrl: string;
  creator?: string;
  releaseYear?: number;
  whereToWatch?: string[];
  whereToRead?: string[];
  whereToListen?: string[];
  suggestedBy?: string;
}

const FriendActivity = () => {
  const navigate = useNavigate();

  const friendActivityContent: ContentItem[] = [
    {
      id: "1",
      title: "Inception",
      type: "movie",
      imageUrl:
        "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&q=80",
      creator: "Christopher Nolan",
      releaseYear: 2010,
      whereToWatch: ["Netflix", "Amazon Prime"],
      suggestedBy: "Alex Chen",
    },
    {
      id: "2",
      title: "The Alchemist",
      type: "book",
      imageUrl:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
      creator: "Paulo Coelho",
      releaseYear: 1988,
      whereToRead: ["Amazon Kindle", "Local Bookstore"],
      suggestedBy: "Jamie Smith",
    },
    {
      id: "3",
      title: "Attack on Titan",
      type: "anime",
      imageUrl:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
      creator: "Hajime Isayama",
      releaseYear: 2013,
      whereToWatch: ["Crunchyroll", "Funimation"],
      suggestedBy: "Taylor Wong",
    },
  ];

  const handleCardClick = (id: string) => {
    navigate(`/content/${id}`);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Friend Activity</h1>
      <p className="text-gray-600 mb-8">
        See what your friends are watching, reading, and listening to.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {friendActivityContent.map((item) => (
          <Card
            key={item.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCardClick(item.id)}
          >
            <CardHeader className="p-0">
              <div className="h-48 w-full overflow-hidden rounded-t-lg">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <CardTitle className="text-xl">{item.title}</CardTitle>
              <div className="mt-2 text-sm text-gray-600">
                <p>
                  {item.creator} • {item.releaseYear}
                </p>
                <p className="mt-1 capitalize">{item.type}</p>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-sm text-gray-500">
              <p>Suggested by {item.suggestedBy}</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FriendActivity;

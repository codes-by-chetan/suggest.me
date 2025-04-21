/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PostCardProps {
  id: string;
  imageUrl: string;
  likes: number;
  comments: number;
  caption?: string;
  onClick?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  id = "1",
  imageUrl = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80",
  likes = 0,
  comments = 0,
  caption,
  onClick,
}) => {
  return (
    <Card
      className="overflow-hidden border-0 rounded-md bg-white hover:shadow-md transition-shadow duration-200 cursor-pointer dark:bg-muted"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img src={imageUrl} alt="Post" className="object-cover w-full h-full" />
      </div>
      <CardContent className="p-3 dark:bg-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <Heart className="h-5 w-5" />
              <span className="sr-only">Like</span>
            </Button>
            <span className="text-sm">{likes}</span>

            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">Comment</span>
            </Button>
            <span className="text-sm">{comments}</span>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <Share2 className="h-5 w-5" />
            <span className="sr-only">Share</span>
          </Button>
        </div>

        {caption && <p className="text-sm mt-2 line-clamp-2">{caption}</p>}
      </CardContent>
    </Card>
  );
};

export default PostCard;

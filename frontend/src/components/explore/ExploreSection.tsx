/* eslint-disable @typescript-eslint/no-unused-vars */
import { useNavigate } from "@tanstack/react-router";
import { Link } from "lucide-react";
import { useState } from "react";
import { ExploreContentItem, mockFriendActivity, mockRecommended, mockTrending } from "../layout/data/exploreSection";



interface ExploreSectionProps {
  className?: string;
}

const ExploreSection = ({ className = "" }: ExploreSectionProps) => {
  const navigate = useNavigate();
  const [exploreContent, setExploreContent] = useState({
    trending: mockTrending,
    friendActivity: mockFriendActivity,
    recommended: mockRecommended,
  });

  // Mock function to fetch explore content

  const renderContentCard = (item: ExploreContentItem) => (
    <div
      key={item.id}
      className="bg-background rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-md transition-all cursor-pointer"
      onClick={() =>
        navigate({to: `/content/${item.id}`})
      }
    >
      {item.imageUrl && (
        <div className="w-full h-40 bg-muted">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-primary capitalize">
            {item.type}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(item.suggestedAt).toLocaleDateString()}
          </span>
        </div>
        <h3 className="font-semibold text-lg mb-1 line-clamp-1 text-foreground">
          {item.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          {item.creator} • {item.year}
        </p>

        {item.suggestedBy && (
          <div className="flex items-center pt-3 border-t border-border">
            <span className="text-xs font-medium text-foreground mr-2">
              {item.status === "watching"
                ? "Currently watching:"
                : "Suggested by:"}
            </span>
            <div className="flex items-center">
              {item.suggestedBy.avatar && (
                <div className="h-5 w-5 rounded-full overflow-hidden mr-1 ring-1 ring-primary/20">
                  <img
                    src={item.suggestedBy.avatar}
                    alt={item.suggestedBy.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <span className="text-xs font-medium text-foreground">
                {item.suggestedBy.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ContentRow = ({
    contentArray,
    heading,
  }: {
    contentArray: ExploreContentItem[];
    heading: string;
  }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">{heading}</h2>
        <Link
        
          to="/explore/trending"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">
          {contentArray.slice(0, 3).map(renderContentCard)}
        </div>

        {/* Fade overlay */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-background to-transparent" />
      </div>
    </div>
  );

  return (
    <div className={`${className}`}>
      <ContentRow
        heading="Trending Now"
        contentArray={exploreContent.trending}
      />

      <ContentRow
        heading="Friend Activity"
        contentArray={exploreContent.friendActivity}
      />

      <ContentRow
        heading="Recommended For You"
        contentArray={exploreContent.recommended}
      />
    </div>
  );
};

export default ExploreSection;

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Settings } from "lucide-react";

// optional for now
interface ProfileHeaderProps {
  userData: {
    name?: string;
    email?: string;
    avatar?: string;
    location?: string;
    joinDate?: string;
    bio?: string;
    
  };
  accountHolder?: boolean;
  friendsCount?: number | 0;
  postsCount?: number | 0;
  followingCount?: number | 0;
  onEditProfile: () => void;
  onOpenSettings?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userData,
  friendsCount,
  postsCount = 12,
  followingCount = 24,
  onEditProfile,
  onOpenSettings,
  accountHolder =  true
}) => {
  
  return (
    <div className="py-8 border-b border-border">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
        {/* Profile picture */}
        <div className="flex-shrink-0">
          <Avatar className="h-20 w-20 md:h-36 md:w-36 border-2 border-primary-200 p-1 rounded-full">
            <AvatarImage
              src={userData?.avatar}
              alt={userData?.name}
              className="rounded-full"
            />
            <AvatarFallback className="text-2xl">
              {userData?.name ? userData?.name.charAt(0) : ""}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Profile info */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h1 className="text-xl font-medium">{userData?.name}</h1>
            {accountHolder && <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-9 bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100"
                onClick={onEditProfile}
              >
                Edit Profile
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={onOpenSettings || onEditProfile}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>}
          </div>

          {/* Stats row */}
          <div className="flex gap-8">
            <div className="text-center md:text-left">
              <span className="font-semibold">{postsCount}</span>
              <span className="text-muted-foreground ml-1">Posts</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-semibold">{friendsCount}</span>
              <span className="text-muted-foreground ml-1">Friends</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-semibold">{followingCount}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <p className="font-medium">{userData?.name}</p>
            <p className="text-sm">{userData?.bio}</p>
            <div className="flex items-center mt-2">
              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-sm">{userData?.location}</span>
            </div>
            <div className="flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-sm">Joined {userData?.joinDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;

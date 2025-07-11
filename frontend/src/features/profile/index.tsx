import React, { useCallback, useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PostCard from "@/components/profile/PostCard";
import {
  UserPlus,
  UserMinus,
  Users,
  Grid,
  Bookmark,
  Settings,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { SavedItem, savedItemsArray } from "@/data/mySavedItem";
import { myPostsArray, Post } from "@/data/myPosts";
import { Friend, myFriendsArray } from "@/data/myFriends";
import UserService from "@/services/user.service";
import { UserProfileData } from "@/interfaces/user.interface";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";

const Profile = () => {
  const userService = new UserService();
  const [activeTab, setActiveTab] = useState("profile");
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const authProvider = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [savedItems, setSavedItems] = useState<SavedItem[]>(savedItemsArray);
  const [posts, setPosts] = useState<Post[]>(myPostsArray);
  const [friends, setFriends] = useState<Friend[]>(myFriendsArray);

  const { id } = useParams();

  const refreshDetails = useCallback(async () => {
    setIsLoading(true);
    authProvider.refreshAuthState();
    const response = id
      ? await userService.getUserProfileById(id)
      : await userService.getUserProfile();

    if (response.success && response.data) {
      setUserData(response.data);
    } else {
      // getToast("error", response.message);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, [id]);

  useEffect(() => {
    refreshDetails();
  }, []);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  const handleRemoveFriend = (friendId: string) => {
    setFriends(friends.filter((friend) => friend.id !== friendId));
  };

  const handlePostClick = (postId: string) => {
    console.log(`Post clicked: ${postId}`);
  };

  const handleSavedItemClick = (itemId: string) => {
    console.log(`Saved item clicked: ${itemId}`);
  };

  // Loading UI Component
  const LoadingSkeleton = () => (
    <div className="max-w-4xl mx-auto pt-0 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center space-x-4 mb-8">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );

  // Animation variants for framer-motion
  const variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <LoadingSkeleton />
          </motion.div>
        ) : userData ? (
          <motion.main
            key="main"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="max-w-4xl w-full mx-auto pt-0 pb-[10vh] px-4 sm:px-6 lg:px-8"
          >
            <ProfileHeader
              userData={userData}
              FollowersCount={userData.relations.followers.count}
              onEditProfile={() => navigate("/edit-profile")}
              onOpenSettings={() => setShowSettingsDialog(true)}
              followingCount={userData.relations.followings.count}
              postsCount={userData.postsCount}
              refreshProfile={refreshDetails}
              accountHolder={id ? id === authProvider?.user?._id : true}
            />

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full my-4 bg-transparent border-b border-border rounded-none h-auto p-0">
                <TabsTrigger
                  value="profile"
                  className="flex items-center justify-center py-3 rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Posts
                </TabsTrigger>
                <TabsTrigger
                  value="friends"
                  className="flex items-center justify-center py-3 rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Friends
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="flex items-center justify-center py-3 rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Saved
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-0 w-full">
                <div className="grid grid-cols-3 gap-1 md:gap-4 w-full">
                  {posts?.map((post) => (
                    <div key={post.id} className="w-full aspect-square">
                      <PostCard
                        id={post.id}
                        imageUrl={post.imageUrl}
                        likes={post.likes}
                        comments={post.comments}
                        caption={post.caption}
                        onClick={() => handlePostClick(post.id)}
                        
                      />
                    </div>
                  ))}
                </div>
                {posts?.length === 0 && (
                  <div className="text-center py-12 w-full">
                    <p className="text-muted-foreground">No posts yet.</p>
                    <Button variant="outline" className="mt-4">
                      Create your first post
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="friends" className="mt-0 w-full">
                <Card className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Friends</CardTitle>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Friend
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {friends?.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/10 min-w-full box-border"
                        >
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage
                                src={friend.avatar}
                                alt={friend.name}
                              />
                              <AvatarFallback>
                                {friend.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{friend.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {friend.email}
                              </p>
                              {friend.mutualFriends && (
                                <p className="text-xs text-muted-foreground">
                                  {friend.mutualFriends} mutual friends
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            onClick={() => handleRemoveFriend(friend.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {friends?.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        You don't have any friends yet. Add some friends to get
                        started!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="saved" className="mt-0 w-full">
                <div className="mb-6 w-full">
                  <h2 className="text-xl font-semibold mb-4">Saved Items</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {savedItems?.map((item) => (
                      <Card
                        key={item.id}
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-all min-w-full box-border"
                        onClick={() => handleSavedItemClick(item.id)}
                      >
                        <div
                          className="h-40 w-full bg-muted"
                          onClick={() =>
                            navigate(`/content/${item.id}`, {
                              state: { contentDetails: item },
                            })
                          }
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-primary capitalize">
                              {item.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Saved on{" "}
                              {new Date(item.savedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3
                            className="font-semibold text-lg mb-1"
                            onClick={() =>
                              navigate(`/content/${item.id}`, {
                                state: { contentDetails: item },
                              })
                            }
                          >
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.creator} • {item.year}
                          </p>
                          <div className="mt-4 flex justify-center">
                            <Button
                              className="w-full"
                              onClick={() =>
                                navigate(`/content/${item.id}`, {
                                  state: { contentDetails: item },
                                })
                              }
                            >
                              More Info...
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {savedItems?.length === 0 && (
                    <div className="text-center py-12 bg-muted/20 rounded-lg w-full">
                      <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No saved items yet.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Items you save will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </motion.main>
        ) : (
          <motion.div
            key="error"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 text-center"
          >
            <p className="text-muted-foreground">
              Failed to load profile data.
            </p>
            <Button variant="outline" className="mt-4" onClick={refreshDetails}>
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {showSettingsDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowSettingsDialog(false)}
        >
          <div
            className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" /> Profile Settings
            </h2>
            <div className="space-y-4">
              <div className="p-3 hover:bg-accent rounded-md cursor-pointer flex items-center justify-between">
                <span>Privacy</span>
                <span className="text-muted-foreground">→</span>
              </div>
              <div className="p-3 hover:bg-accent rounded-md cursor-pointer flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-muted-foreground">→</span>
              </div>
              <div className="p-3 hover:bg-accent rounded-md cursor-pointer flex items-center justify-between">
                <span>Account Security</span>
                <span className="text-muted-foreground">→</span>
              </div>
              <div className="p-3 hover:bg-accent rounded-md cursor-pointer flex items-center justify-between">
                <span>Theme</span>
                <span className="text-muted-foreground">→</span>
              </div>
              <div className="p-3 hover:bg-accent rounded-md cursor-pointer flex items-center justify-between text-destructive">
                <span>Logout</span>
                <span className="text-muted-foreground">→</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSettingsDialog(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
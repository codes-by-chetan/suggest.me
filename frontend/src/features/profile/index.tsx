import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Friend, myFriendsArray } from '@/data/myFriends';
import { myPostsArray, Post } from '@/data/myPosts';
import { SavedItem, savedItemsArray } from '@/data/mySavedItem';
import { UserProfileData } from '@/interfaces/user.interface';
import UserService from '@/services/user.service';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  UserMinus,
  Users,
  Grid,
  Bookmark,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PostCard from '@/components/profile/PostCard';
import ProfileHeader from '@/components/profile/ProfileHeader';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [_isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const authProvider = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [savedItems, _setSavedItems] = useState<SavedItem[]>(savedItemsArray);
  const [posts, _setPosts] = useState<Post[]>(myPostsArray);
  const [friends, setFriends] = useState<Friend[]>(myFriendsArray);

  const { id } = useParams({ from: '/_authenticated/profile/$id/' });

  const refreshDetails = useCallback(async () => {
    setIsLoading(true);
    authProvider.refreshAuthState();
    const response = id
      ? await UserService.getUserProfileById(id)
      : await UserService.getUserProfile();

    if (response.success && response.data) {
      setUserData(response.data as UserProfileData);
    } else {
      // getToast("error", response.message);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, [id]);

  useEffect(() => {
    refreshDetails();
  }, [id]);

  const _handleProfileUpdate = (e: React.FormEvent) => {
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
    <div className='mx-auto max-w-4xl px-4 pt-0 sm:px-6 lg:px-8'>
      <div className='mb-8 flex items-center space-x-4'>
        <Skeleton className='h-24 w-24 rounded-full' />
        <div className='flex-1 space-y-2'>
          <Skeleton className='h-8 w-1/3' />
          <Skeleton className='h-4 w-1/2' />
          <Skeleton className='h-4 w-1/4' />
        </div>
      </div>
      <div className='grid grid-cols-3 gap-4'>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className='h-40 w-full' />
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
    <div className='bg-background min-h-screen'>
      <AnimatePresence mode='wait'>
        {isLoading ? (
          <motion.div
            key='loading'
            variants={variants}
            initial='initial'
            animate='animate'
            exit='exit'
            transition={{ duration: 0.3 }}
          >
            <LoadingSkeleton />
          </motion.div>
        ) : userData ? (
          <motion.main
            key='main'
            variants={variants}
            initial='initial'
            animate='animate'
            exit='exit'
            transition={{ duration: 0.3 }}
            className='mx-auto w-full max-w-4xl px-4 pt-0 pb-[10vh] sm:px-6 lg:px-8'
          >
            <ProfileHeader
              userData={userData}
              FollowersCount={userData.relations.followers.count}
              onEditProfile={() => navigate({ to: '/edit-profile' })}
              onOpenSettings={() => setShowSettingsDialog(true)}
              followingCount={userData.relations.followings.count}
              postsCount={userData.postsCount}
              refreshProfile={refreshDetails}
              accountHolder={id ? id === authProvider?.user?._id : true}
            />

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full'
            >
              <TabsList className='border-border my-4 grid h-auto w-full grid-cols-3 rounded-none border-b bg-transparent p-0'>
                <TabsTrigger
                  value='profile'
                  className='data-[state=active]:border-primary flex items-center justify-center rounded-none border-0 py-3 data-[state=active]:border-b-2 data-[state=active]:shadow-none'
                >
                  <Grid className='mr-2 h-4 w-4' />
                  Posts
                </TabsTrigger>
                <TabsTrigger
                  value='friends'
                  className='data-[state=active]:border-primary flex items-center justify-center rounded-none border-0 py-3 data-[state=active]:border-b-2 data-[state=active]:shadow-none'
                >
                  <Users className='mr-2 h-4 w-4' />
                  Friends
                </TabsTrigger>
                <TabsTrigger
                  value='saved'
                  className='data-[state=active]:border-primary flex items-center justify-center rounded-none border-0 py-3 data-[state=active]:border-b-2 data-[state=active]:shadow-none'
                >
                  <Bookmark className='mr-2 h-4 w-4' />
                  Saved
                </TabsTrigger>
              </TabsList>

              <TabsContent value='profile' className='mt-0 w-full'>
                <div className='grid w-full grid-cols-3 gap-1 md:gap-4'>
                  {posts?.map((post) => (
                    <div key={post.id} className='aspect-square w-full'>
                      <PostCard
                        _id={post.id}
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
                  <div className='w-full py-12 text-center'>
                    <p className='text-muted-foreground'>No posts yet.</p>
                    <Button variant='outline' className='mt-4'>
                      Create your first post
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value='friends' className='mt-0 w-full'>
                <Card className='w-full'>
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <CardTitle>Friends</CardTitle>
                    <Button variant='outline' size='sm'>
                      <UserPlus className='mr-2 h-4 w-4' />
                      Add Friend
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className='grid w-full grid-cols-1 gap-4 md:grid-cols-2'>
                      {friends?.map((friend) => (
                        <div
                          key={friend.id}
                          className='hover:bg-accent/10 box-border flex min-w-full items-center justify-between rounded-md border p-3'
                        >
                          <div className='flex items-center'>
                            <Avatar className='mr-3 h-10 w-10'>
                              <AvatarImage
                                src={friend.avatar}
                                alt={friend.name}
                              />
                              <AvatarFallback>
                                {friend.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className='font-medium'>{friend.name}</h4>
                              <p className='text-muted-foreground text-xs'>
                                {friend.email}
                              </p>
                              {friend.mutualFriends && (
                                <p className='text-muted-foreground text-xs'>
                                  {friend.mutualFriends} mutual friends
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                            onClick={() => handleRemoveFriend(friend.id)}
                          >
                            <UserMinus className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {friends?.length === 0 && (
                      <p className='text-muted-foreground py-8 text-center'>
                        You don't have any friends yet. Add some friends to get
                        started!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='saved' className='mt-0 w-full'>
                <div className='mb-6 w-full'>
                  <h2 className='mb-4 text-xl font-semibold'>Saved Items</h2>
                  <div className='grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {savedItems?.map((item) => (
                      <Card
                        key={item.id}
                        className='box-border min-w-full cursor-pointer overflow-hidden transition-all hover:shadow-md'
                        onClick={() => handleSavedItemClick(item.id)}
                      >
                        <div
                          className='bg-muted h-40 w-full'
                          onClick={() =>
                            navigate({ to: `/content/${item.id}` })
                          }
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className='h-full w-full object-cover'
                          />
                        </div>
                        <CardContent className='p-4'>
                          <div className='mb-2 flex items-center justify-between'>
                            <span className='text-primary text-xs font-medium capitalize'>
                              {item.type}
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              Saved on{' '}
                              {new Date(item.savedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3
                            className='mb-1 text-lg font-semibold'
                            onClick={() =>
                              navigate({ to: `/content/${item.id}` })
                            }
                          >
                            {item.title}
                          </h3>
                          <p className='text-muted-foreground text-sm'>
                            {item.creator} • {item.year}
                          </p>
                          <div className='mt-4 flex justify-center'>
                            <Button
                              className='w-full'
                              onClick={() =>
                                navigate({ to: `/content/${item.id}` })
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
                    <div className='bg-muted/20 w-full rounded-lg py-12 text-center'>
                      <Bookmark className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                      <p className='text-muted-foreground'>
                        No saved items yet.
                      </p>
                      <p className='text-muted-foreground mt-2 text-sm'>
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
            key='error'
            variants={variants}
            initial='initial'
            animate='animate'
            exit='exit'
            transition={{ duration: 0.3 }}
            className='mx-auto max-w-4xl px-4 pt-20 text-center sm:px-6 lg:px-8'
          >
            <p className='text-muted-foreground'>
              Failed to load profile data.
            </p>
            <Button variant='outline' className='mt-4' onClick={refreshDetails}>
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {showSettingsDialog && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
          onClick={() => setShowSettingsDialog(false)}
        >
          <div
            className='bg-background w-full max-w-md rounded-lg p-6 shadow-lg'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className='mb-4 flex items-center text-xl font-semibold'>
              <Settings className='mr-2 h-5 w-5' /> Profile Settings
            </h2>
            <div className='space-y-4'>
              <div className='hover:bg-accent flex cursor-pointer items-center justify-between rounded-md p-3'>
                <span>Privacy</span>
                <span className='text-muted-foreground'>→</span>
              </div>
              <div className='hover:bg-accent flex cursor-pointer items-center justify-between rounded-md p-3'>
                <span>Notifications</span>
                <span className='text-muted-foreground'>→</span>
              </div>
              <div className='hover:bg-accent flex cursor-pointer items-center justify-between rounded-md p-3'>
                <span>Account Security</span>
                <span className='text-muted-foreground'>→</span>
              </div>
              <div className='hover:bg-accent flex cursor-pointer items-center justify-between rounded-md p-3'>
                <span>Theme</span>
                <span className='text-muted-foreground'>→</span>
              </div>
              <div className='hover:bg-accent text-destructive flex cursor-pointer items-center justify-between rounded-md p-3'>
                <span>Logout</span>
                <span className='text-muted-foreground'>→</span>
              </div>
            </div>
            <div className='mt-6 flex justify-end'>
              <Button
                variant='outline'
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

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useRouter } from '@tanstack/react-router'
import {
  UserPlus,
  UserMinus,
  Users,
  Grid,
  Bookmark,
  Settings,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Navbar from '@/components/layout/Navbar'
import { suggestorsArray } from '@/components/layout/data/suggestors'
import PostCard from '@/components/profile/PostCard'
import ProfileHeader from '@/components/profile/ProfileHeader'
import { Friend, myFriendsArray } from '../data/myFriends'
import { myPostsArray, Post } from '../data/myPosts'
import { SavedItem, savedItemsArray } from '../data/mySavedItem'

const defaultUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  location: 'San Francisco, CA',
  joinDate: 'January 2023',
  bio: 'Movie enthusiast and book lover. Always looking for new recommendations!',
}

const SelfProfile = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const navigate = useNavigate()
  // Mock user data - in a real app, this would come from an API
  // for now the type is given s any as the fields in the object differ from suggestor
  const [userData, setUserData] = useState<any>(defaultUser)

  // Mock saved items data
  const [savedItems, setSavedItems] = useState<SavedItem[]>(savedItemsArray)

  // Mock posts data
  const [posts, setPosts] = useState<Post[]>(myPostsArray)

  // Mock friends data
  const [friends, setFriends] = useState<Friend[]>(myFriendsArray)
  const accountHolder = true // This would be determined by the logged-in user's ID

  // Mock function to handle profile update
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would send the updated profile to the backend
    setIsEditing(false)
  }

  // Mock function to handle friend removal
  const handleRemoveFriend = (friendId: string) => {
    setFriends(friends.filter((friend) => friend.id !== friendId))
    // In a real app, this would send a request to the backend
  }

  // Mock function to handle post click
  const handlePostClick = (postId: string) => {
    // console.log(`Post clicked: ${postId}`);
    // In a real app, this would navigate to the post detail page or open a modal
  }

  // Mock function to handle saved item click
  const handleSavedItemClick = (itemId: string) => {
    // console.log(`Saved item clicked: ${itemId}`);
    // In a real app, this would navigate to the content detail page
  }

  return (
    <div className='p-4 px-[80px]'>
        <ProfileHeader
          userData={userData}
          friendsCount={friends.length | userData?.friendsCount}
          onEditProfile={() => navigate({ to: '/profile/update-profile' })}
          onOpenSettings={() => setShowSettingsDialog(true)}
          followingCount={userData?.followingCount}
          postsCount={userData?.postsCount}
          accountHolder={accountHolder} // id id is present means we are navigating to the profile of another user
        />

        {/* Instagram-like tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
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

          <TabsContent value='profile' className='mt-0'>
            {/* Posts Grid */}
            <div className='grid grid-cols-3 gap-1 md:gap-4'>
              {posts?.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  imageUrl={post.imageUrl}
                  likes={post.likes}
                  comments={post.comments}
                  caption={post.caption}
                  onClick={() => handlePostClick(post.id)}
                />
              ))}
            </div>

            {posts?.length === 0 && (
              <div className='py-12 text-center'>
                <p className='text-muted-foreground'>No posts yet.</p>
                <Button variant='outline' className='mt-4'>
                  Create your first post
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value='friends' className='mt-0'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle>Friends</CardTitle>
                <Button variant='outline' size='sm'>
                  <UserPlus className='mr-2 h-4 w-4' />
                  Add Friend
                </Button>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  {friends?.map((friend) => (
                    <div
                      key={friend.id}
                      className='hover:bg-accent/10 flex items-center justify-between rounded-md border p-3'
                    >
                      <div className='flex items-center'>
                        <Avatar className='mr-3 h-10 w-10'>
                          <AvatarImage src={friend.avatar} alt={friend.name} />
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

          <TabsContent value='saved' className='mt-0'>
            {/* Saved Items Grid */}
            <div className='mb-6'>
              <h2 className='mb-4 text-xl font-semibold'>Saved Items</h2>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {savedItems?.map((item) => (
                  <Card
                    key={item.id}
                    className='cursor-pointer overflow-hidden transition-all hover:shadow-md'
                    onClick={() => handleSavedItemClick(item.id)}
                  >
                    <div
                      className='bg-muted h-40 w-full'
                      onClick={() =>
                        navigate({to: `/content/${item.id}`})
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
                          Saved on {new Date(item.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3
                        className='mb-1 text-lg font-semibold'
                        onClick={() =>
                          navigate({to: `/content/${item.id}`})
                        }
                      >
                        {item.title}
                      </h3>
                      <p className='text-muted-foreground text-sm'>
                        {item.creator} • {item.year}
                      </p>
                      <div className='mt-4 flex w-[100%] justify-center'>
                        <Button
                          className='w-full'
                          onClick={() =>
                            navigate({to: `/content/${item.id}`})
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
                <div className='bg-muted/20 rounded-lg py-12 text-center'>
                  <Bookmark className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                  <p className='text-muted-foreground'>No saved items yet.</p>
                  <p className='text-muted-foreground mt-2 text-sm'>
                    Items you save will appear here.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      

      {/* Settings Dialog */}
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
  )
}

export default SelfProfile

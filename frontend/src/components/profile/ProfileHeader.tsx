/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { UserProfileData } from '@/interfaces/user.interface';
import { getAccessToken } from '@/services/token.service';
import UserService from '@/services/user.service';
import { MapPin, Calendar, Settings } from 'lucide-react';
import { useSocket } from '@/context/socket-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ProfilePictureUploader from './ProfilePictureUploader';
import VerifiedBadgeIcon from './VerifiedBadgeIcon';

interface ProfileHeaderProps {
  userData: UserProfileData | null;
  accountHolder?: boolean;
  FollowersCount?: number | 0;
  postsCount?: number | 0;
  followingCount?: number | 0;
  onEditProfile: () => void;
  onOpenSettings?: () => void;
  refreshProfile: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userData,
  FollowersCount = 0,
  postsCount = 12,
  followingCount = 24,
  onEditProfile,
  onOpenSettings,
  accountHolder = true,
  refreshProfile = () => {},
}) => {
  const [isFollowing, setIsFollowing] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [followsYou, setFollowsYou] = useState<{ [key: string]: any } | null>(
    null
  );

  const navigate = useNavigate();
  const { socket } = useSocket();

  socket?.on('followAccepted', (data: any) => {
    if (data.following === userData?.id) {
      setIsFollowing('Accepted');
      followingCount += 1;
    }
  });
  socket?.on('followedYou', (data: any) => {
    if (data.follower === userData?.id) {
      setFollowsYou(data);
      FollowersCount += 1;
    }
  });
  socket?.on('unFollowedYou', (data: any) => {
    if (data.follower === userData?.id) {
      setFollowsYou(null);
      FollowersCount -= 1;
    }
  });

  const handleAccept = () => {
    UserService.acceptFollowRequest(followsYou?._id).then((res) => {
      if (res.success && res.data) setFollowsYou(res.data);
    });
  };

  useEffect(() => {
    const checkFollowStatus = async () => {
      const token = getAccessToken();
      if (!accountHolder && token && userData?.id) {
        try {
          const response = await UserService.getRelation(userData.id);
          if (response.data) setIsFollowing(response.data.status || null);
        } catch (_error) {
          setIsFollowing(null);
        }
        await UserService.getFollowsYou(userData.id).then((res) => {
          if (res.success && res.data) setFollowsYou(res.data);
        });
      }
    };
    checkFollowStatus();
  }, [accountHolder, userData?.id]);

  const handleImageSubmit = async (formData: FormData) => {
    setIsUploading(true);
    try {
      await UserService.updateUserProfilePicture(formData);
      refreshProfile();
      setShowUploader(false);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFollowToggle = async () => {
    const token = getAccessToken();
    if (!token) {
      navigate({ to: '/sign-in-2' });
      return;
    }
    try {
      if (isFollowing === 'Accepted') {
        await UserService.unFollowUser(userData?.id).then((res) => {
          if (res.success) {
            setIsFollowing(null);
            followingCount -= 1;
          }
        });
      } else if (isFollowing === 'Pending') {
        await UserService.unFollowUser(userData?.id).then((_res) => {
          setIsFollowing(null);
        });
      } else {
        const res = await UserService.followUser(userData?.id);
        if (res.success) {
          setIsFollowing(res.data.status || 'pending');
          followingCount += 1;
        }
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    }
  };

  return (
    <div className='bg-background px-4 py-3 sm:px-0 sm:pb-6'>
      <div className='mx-auto max-w-3xl flex-col'>
        {/* Profile picture and stats container */}
        <div className='flex flex-row items-start gap-4 sm:gap-6'>
          {/* Profile picture */}
          <div className='relative flex-shrink-0'>
            <Avatar className='h-[77px] w-[77px] rounded-full border-2 border-gray-200 sm:h-32 sm:w-32'>
              {userData?.profile?.avatar ? (
                <AvatarImage
                  src={userData?.profile?.avatar?.url}
                  alt={userData?.fullNameString}
                  className='rounded-full'
                />
              ) : (
                <AvatarFallback className='text-primary-800 bg-gray-200 text-3xl font-bold sm:text-4xl'>
                  {userData?.fullName.firstName.charAt(0)}
                  {userData?.fullName.lastName.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            {accountHolder && (
              <ProfilePictureUploader
                onImageSubmit={handleImageSubmit}
                currentAvatar={userData?.profile?.avatar?.url}
                isLoading={isUploading}
                userInitials={`${
                  userData?.fullName?.firstName?.charAt(0) || 'U'
                }${userData?.fullName?.lastName?.charAt(0) || 'S'}`}
              />
            )}
          </div>

          {/* Stats and buttons container */}
          <div className='flex flex-1 flex-col'>
            {/* Username and settings */}
            <div className='mb-2 flex items-center justify-between sm:mb-3'>
              <div className='flex items-center gap-1 sm:gap-2'>
                <h1 className='text-base font-semibold sm:text-xl'>
                  {userData?.fullNameString}
                </h1>
                {userData?.profile.isVerified && (
                  <VerifiedBadgeIcon className='h-4 w-4 sm:h-5 sm:w-5' />
                )}
              </div>
              {accountHolder ? (
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    className='hidden h-8 items-center justify-center border-gray-300 px-4 text-sm hover:bg-gray-100 sm:flex'
                    onClick={onEditProfile}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6 sm:h-8 sm:w-8'
                    onClick={onOpenSettings || onEditProfile}
                  >
                    <Settings className='h-4 w-4' />
                  </Button>
                </div>
              ) : (
                <div className='hidden sm:flex sm:flex-col'>
                  <Button
                    variant={isFollowing === 'Accepted' ? 'outline' : 'default'}
                    className={`h-8 text-sm ${
                      isFollowing === 'Accepted'
                        ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        : isFollowing === 'Pending'
                          ? 'border-gray-300 bg-slate-500 text-white hover:bg-slate-700'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                    } items-center justify-center px-4`}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing === 'Accepted'
                      ? 'Unfollow'
                      : isFollowing === 'Pending'
                        ? 'Withdraw'
                        : 'Follow'}
                  </Button>
                  {isFollowing === 'Pending' && (
                    <span className='w-full text-center text-xs text-green-500'>
                      Requested
                    </span>
                  )}
                  {followsYou?.status === 'Accepted' && (
                    <span className='text-center text-xs text-gray-600'>
                      Follows You
                    </span>
                  )}
                  {followsYou?.status === 'Pending' && (
                    <>
                      <span className='text-center text-xs text-gray-600'>
                        Requested to Follow You
                      </span>
                      <Button
                        variant='default'
                        className='h-[30px] w-full items-center justify-center bg-blue-500 px-4 text-sm font-medium text-white hover:bg-blue-600'
                        onClick={handleAccept}
                      >
                        Accept
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className='mb-2 flex justify-between sm:mb-3 sm:gap-6'>
              <div className='text-center'>
                <span className='text-sm font-semibold sm:text-base'>
                  {postsCount}
                </span>
                <span className='ml-1 text-xs text-gray-600 sm:text-sm'>
                  Posts
                </span>
              </div>
              <div className='text-center'>
                <span className='text-sm font-semibold sm:text-base'>
                  {FollowersCount}
                </span>
                <span className='ml-1 text-xs text-gray-600 sm:text-sm'>
                  Followers
                </span>
              </div>
              <div className='text-center'>
                <span className='text-sm font-semibold sm:text-base'>
                  {followingCount}
                </span>
                <span className='ml-1 text-xs text-gray-600 sm:text-sm'>
                  Following
                </span>
              </div>
            </div>

            {/* Buttons for mobile */}
            {accountHolder ? (
              <Button
                variant='outline'
                className='h-[30px] w-full items-center justify-center border-gray-200 bg-gray-100 px-4 text-sm font-medium text-gray-800 hover:bg-gray-200 sm:hidden'
                onClick={onEditProfile}
              >
                Edit Profile
              </Button>
            ) : (
              <div className='flex flex-col gap-1 sm:hidden'>
                <Button
                  variant={isFollowing === 'Accepted' ? 'outline' : 'default'}
                  className={`h-[30px] w-full text-sm ${
                    isFollowing === 'Accepted'
                      ? 'border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200'
                      : isFollowing === 'Pending'
                        ? 'border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                  } items-center justify-center px-4 font-medium`}
                  onClick={handleFollowToggle}
                >
                  {isFollowing === 'Accepted'
                    ? 'Unfollow'
                    : isFollowing === 'Pending'
                      ? 'Withdraw'
                      : 'Follow'}
                </Button>
                {isFollowing === 'Pending' && (
                  <span className='text-center text-xs text-green-500'>
                    Requested
                  </span>
                )}
                {followsYou?.status === 'Accepted' && (
                  <span className='text-center text-xs text-gray-600'>
                    Follows You
                  </span>
                )}
                {followsYou?.status === 'Pending' && (
                  <>
                    <span className='text-center text-xs text-gray-600'>
                      Requested to Follow You
                    </span>
                    <Button
                      variant='default'
                      className='h-[30px] w-full items-center justify-center bg-blue-500 px-4 text-sm font-medium text-white hover:bg-blue-600'
                      onClick={handleAccept}
                    >
                      Accept
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Bio and details */}
            <div className='mt-2 hidden sm:mt-4 sm:block'>
              <p className='text-sm font-medium'>
                {userData?.profile?.displayName}
              </p>
              <p className='text-sm leading-tight text-gray-600'>
                {userData?.profile?.bio}
              </p>
              {userData?.profile?.location && (
                <div className='mt-0.5 flex items-center sm:mt-2'>
                  <MapPin className='mr-1 h-4 w-4 text-gray-500' />
                  <span className='text-sm text-gray-600'>
                    {userData?.profile?.location}
                  </span>
                </div>
              )}
              <div className='mt-0.5 flex items-center sm:mt-1'>
                <Calendar className='mr-1 h-4 w-4 text-gray-500' />
                <span className='text-sm text-gray-600'>
                  Joined{' '}
                  {userData?.createdAt
                    ? new Date(userData.createdAt).toLocaleDateString()
                    : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className='mt-2 sm:mt-4 sm:hidden'>
          <p className='text-sm font-medium'>{userData?.fullNameString}</p>
          <p className='text-sm leading-tight text-gray-600'>
            {userData?.profile?.bio}
          </p>
          <div className='mt-0.5 flex items-center sm:mt-2'>
            <MapPin className='mr-1 h-4 w-4 text-gray-500' />
            <span className='text-sm text-gray-600'>
              {userData?.profile?.location}
            </span>
          </div>
          <div className='mt-0.5 flex items-center sm:mt-1'>
            <Calendar className='mr-1 h-4 w-4 text-gray-500' />
            <span className='text-sm text-gray-600'>
              Joined{' '}
              {userData?.createdAt
                ? new Date(userData.createdAt).toLocaleDateString()
                : ''}
            </span>
          </div>
        </div>
      </div>

      {showUploader && (
        <ProfilePictureUploader
          onImageSubmit={handleImageSubmit}
          isLoading={isUploading}
          currentAvatar={userData?.profile?.avatar?.url}
        />
      )}
    </div>
  );
};

export default ProfileHeader;

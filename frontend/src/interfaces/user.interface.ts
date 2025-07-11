export interface UserProfileResponse {
  statusCode: number;
  data: UserProfileData | null;
  message: string;
  success: boolean;
  redirect: null;
}

export interface UserProfileData {
  fullName: FullName;
  email: string;
  contactNumber: ContactNumber;
  fullNameString: string;
  profile: Profile;
  relations: Relations;
  createdAt: string;
  [key: string]: any;
}

interface Relations {
  followers: Followers;
  followings: Followings;
}

interface Followings {
  count: number;
  followings: any[];
}

interface Followers {
  count: number;
  followers: any[];
}

interface Profile {
  socialLinks: SocialLinks;
  preferences: Preferences;
  isPublic: boolean;
  isVerified: boolean;
  [key: string]: any;
}

interface Preferences {
  favoriteGenres: any[];
  preferredContentTypes: any[];
}

interface SocialLinks {}

interface ContactNumber {
  countryCode: string;
  number: string;
  _id: string;
  id: string;
}

interface FullName {
  firstName: string;
  lastName: string;
  _id: string;
}

export interface friendsResponse {
  statusCode: number;
  data: Datum[];
  message: string;
  success: boolean;
  redirect: null;
}

interface Datum {
  fullName: FullName;
  profile: friendProfile;
  [key: string]: any;
}

interface friendProfile {
  avatar: Avatar;
  isVerified: boolean;
  [key: string]: any;
}

interface Avatar {
  publicId: string;
  url: string;
  [key: string]: any;
}

interface FullName {
  firstName: string;
  lastName: string;
  [key: string]: any;
}

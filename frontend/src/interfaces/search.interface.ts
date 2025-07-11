export interface GlobalSearchResponse {
  statusCode: number;
  data: GSearchResults;
  message: string;
  success: boolean;
  redirect: null;
}

interface GSearchResults {
  results: GlobalSearchResults;
  pagination: Pagination;
}

interface Pagination {
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
}

interface GlobalSearchResults {
  movie: {
    data: MovieItem[];
    total: number;
  };
  series: {
    data: SeriesItem[];
    total: number;
  };
  book: {
    data: BookItem[];
    total: number;
  };
  music: {
    data: MusicItem[];
    total: number;
  };
  songs: {
    data: SongItem[];
    total: number;
  };
  album: {
    data: AlbumItem[];
    total: number;
  };
  video: {
    data: VideoItem[];
    total: number;
  };
  people: {
    data: PeopleItem[];
    total: number;
  };
}

interface ContentCategory {
  data:
    | MovieItem[]
    | SeriesItem[]
    | BookItem[]
    | MusicItem[]
    | SongItem[]
    | AlbumItem[]
    | VideoItem[]
    | PeopleItem[]
    | UserItem[];
  total: number;
}

export interface SearchResultsType {
  movie?: {
    results: MovieItem[];
    totalResults: number;
  };
  series?: {
    results: SeriesItem[];
    totalResults: number;
  };
  book?: {
    results: BookItem[];
    totalResults: number;
  };
  music?: {
    results: MusicItem[];
    totalResults: number;
  };
  songs?: {
    results: SongItem[];
    totalResults: number;
  };
  album?: {
    results: AlbumItem[];
    totalResults: number;
  };
  video?: {
    results: VideoItem[];
    totalResults: number;
  };
  people?: {
    results: PeopleItem[];
    totalResults: number;
  };
  user?: {
    results: UserItem[];
    totalResults: number;
  };
  searchTerm: string;
}

// Union type for all possible search result items
export type SearchResultItem =
  | MovieItem
  | SeriesItem
  | BookItem
  | MusicItem
  | SongItem
  | AlbumItem
  | VideoItem
  | PeopleItem
  | UserItem;

interface MovieItem {
  tmdbId?: number;
  imdbId?: string;
  title: string;
  slug: string;
  poster?: string;
  plot?: string;
  year?: number;
  matchReason: string;
  category?: string;
  [key: string]: any; // Allow additional properties
}

interface SeriesItem {
  tmdbId?: number;
  imdbId?: string;
  title: string;
  slug: string;
  poster?: string;
  plot?: string;
  year?: number;
  matchReason: string;
  category?: string;
  [key: string]: any; // Allow additional properties
}

interface BookItem {
  googleBooksId: string;
  title: string;
  slug: string;
  poster?: string;
  plot?: string;
  year?: number;
  matchReason: string;
  category?: string;
  [key: string]: any; // Allow additional properties
}

interface MusicItem {
  _id?: string;
  spotifyId?: string;
  title: string;
  slug: string;
  poster?: string;
  coverImage?: string;
  plot?: string;
  year?: number;
  releaseYear?: number;
  artists?: string;
  matchReason: string;
  category?: string;
  [key: string]: any; // Allow additional properties
}

interface SongItem {
  _id?: string;
  spotifyId?: string;
  title: string;
  slug: string;
  poster?: string;
  coverImage?: string;
  plot?: string;
  year?: number;
  releaseYear?: number;
  artists?: string;
  matchReason: string;
  category?: string;
  [key: string]: any; // Allow additional properties
}

interface AlbumItem {
  _id?: string;
  spotifyId?: string;
  title: string;
  slug: string;
  poster?: string;
  coverImage?: string;
  plot?: string;
  year?: number;
  releaseYear?: number;
  artists?: string;
  matchReason: string;
  category?: string;
  [key: string]: any; // Allow additional properties
}

interface VideoItem {
  _id?: string;
  title: string;
  slug: string;
  poster?: string;
  coverImage?: string;
  plot?: string;
  year?: number;
  matchReason: string;
  category?: string;
  [key: string]: any; // Allow additional properties
}

interface PeopleItem {
  _id: string;
  name: string;
  slug: string;
  profileImage?: ProfileImage;
  matchReason: string;
  category?: string;
  [key: string]: any; // Allow additional properties
}

interface ProfileImage {
  publicId: string;
  url: string;
  [key: string]: any; // Allow additional properties
}

export interface UserItem {
  _id: string;
  fullName: FullName;
  email?: string;
  profile?: Profile;
  category?: string;
  [key: string]: any; // Allow additional properties
}

interface Profile {
  _id: string;
  user: string;
  preferences?: Preferences;
  isPublic: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdBy: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  avatar?: Avatar;
  updatedBy?: string;
  bio?: string;
  displayName?: string;
  socialLinks?: SocialLinks;
  [key: string]: any; // Allow additional properties
}

interface SocialLinks {
  twitter?: string;
  instagram?: string;
  website?: string;
  [key: string]: any; // Allow additional properties
}

interface Avatar {
  publicId: string;
  url: string;
  [key: string]: any; // Allow additional properties
}

interface Preferences {
  favoriteGenres: string[];
  preferredContentTypes: string[];
  [key: string]: any; // Allow additional properties
}

interface FullName {
  firstName: string;
  lastName: string;
  [key: string]: any; // Allow additional properties
}

export interface PeopleSearchResponse {
  statusCode: number;
  data: PeopleSearchResult;
  message: string;
  success: boolean;
  redirect: null;
  [key: string]: any; // Allow additional properties
}

interface PeopleSearchResult {
  data: UserItem[];
  pagination: Pagination;
  [key: string]: any; // Allow additional properties
}
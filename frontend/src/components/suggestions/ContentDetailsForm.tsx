/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, ImageIcon, Info } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ContentDetailsFormProps {
  contentType?: "movie" | "book" | "anime" | "song" | "video";
  initialData?: any;
  onSubmit?: (data: any) => void;
  onBack?: () => void;
  onNext?: () => void;
}

const movieFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  releaseDate: z.date().optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
  whereToWatch: z.string().optional(),
  description: z.string().optional(),
  posterUrl: z.string().optional(),
  rating: z.string().optional(),
});

const bookFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  author: z.string().min(1, { message: "Author is required" }),
  publishYear: z.string().optional(),
  whereToPurchase: z.string().optional(),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  genre: z.string().optional(),
});

const animeFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  episodes: z.string().optional(),
  releaseYear: z.string().optional(),
  streamingService: z.string().optional(),
  description: z.string().optional(),
  coverArtUrl: z.string().optional(),
  genre: z.string().optional(),
});

const songFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  artist: z.string().min(1, { message: "Artist is required" }),
  album: z.string().optional(),
  releaseYear: z.string().optional(),
  streamingPlatform: z.string().optional(),
  albumArtUrl: z.string().optional(),
  genre: z.string().optional(),
});

const videoFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  creator: z.string().optional(),
  platform: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

const ContentDetailsForm = ({
  contentType = "movie",
  initialData = {},
  onSubmit = () => {},
  onBack = () => {},
  onNext = () => {},
}: ContentDetailsFormProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Select the appropriate schema based on content type
  const getFormSchema = () => {
    switch (contentType) {
      case "movie":
        return movieFormSchema;
      case "book":
        return bookFormSchema;
      case "anime":
        return animeFormSchema;
      case "song":
        return songFormSchema;
      case "video":
        return videoFormSchema;
      default:
        return movieFormSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getFormSchema()),
    defaultValues: initialData,
  });

  const handleSubmit = (data: any) => {
    onSubmit(data);
    onNext();
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: any,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        field.onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderMovieForm = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Movie Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter movie title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="releaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Release Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="comedy">Comedy</SelectItem>
                    <SelectItem value="drama">Drama</SelectItem>
                    <SelectItem value="horror">Horror</SelectItem>
                    <SelectItem value="scifi">Sci-Fi</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="thriller">Thriller</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. English, Spanish" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whereToWatch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Where to Watch</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="netflix">Netflix</SelectItem>
                    <SelectItem value="amazon">Amazon Prime</SelectItem>
                    <SelectItem value="hulu">Hulu</SelectItem>
                    <SelectItem value="disney">Disney+</SelectItem>
                    <SelectItem value="hbo">HBO Max</SelectItem>
                    <SelectItem value="apple">Apple TV+</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1 - Poor</SelectItem>
                    <SelectItem value="2">2 - Below Average</SelectItem>
                    <SelectItem value="3">3 - Average</SelectItem>
                    <SelectItem value="4">4 - Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="posterUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Movie Poster</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-full h-64 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                      {imagePreview || field.value ? (
                        <img
                          src={imagePreview || field.value}
                          alt="Movie poster preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Upload movie poster
                          </p>
                        </div>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, field)}
                      className="max-w-sm"
                    />
                    <Input
                      type="text"
                      placeholder="Or enter image URL"
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setImagePreview(null);
                      }}
                      className="max-w-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter movie description"
                    className="h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );

  const renderBookForm = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Book Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter book title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author</FormLabel>
                <FormControl>
                  <Input placeholder="Enter author name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="publishYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publication Year</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 2023" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fiction">Fiction</SelectItem>
                    <SelectItem value="nonfiction">Non-Fiction</SelectItem>
                    <SelectItem value="mystery">Mystery</SelectItem>
                    <SelectItem value="scifi">Science Fiction</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="biography">Biography</SelectItem>
                    <SelectItem value="selfhelp">Self-Help</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whereToPurchase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Where to Purchase/Read</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="kindle">Kindle</SelectItem>
                    <SelectItem value="audible">Audible</SelectItem>
                    <SelectItem value="barnesnoble">Barnes & Noble</SelectItem>
                    <SelectItem value="applebooks">Apple Books</SelectItem>
                    <SelectItem value="local">Local Bookstore</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="coverUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Book Cover</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-full h-64 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                      {imagePreview || field.value ? (
                        <img
                          src={imagePreview || field.value}
                          alt="Book cover preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Upload book cover
                          </p>
                        </div>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, field)}
                      className="max-w-sm"
                    />
                    <Input
                      type="text"
                      placeholder="Or enter image URL"
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setImagePreview(null);
                      }}
                      className="max-w-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter book description"
                    className="h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );

  const renderAnimeForm = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anime Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter anime title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="episodes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Episodes</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 24" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="releaseYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Release Year</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 2023" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="comedy">Comedy</SelectItem>
                    <SelectItem value="drama">Drama</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="horror">Horror</SelectItem>
                    <SelectItem value="mecha">Mecha</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="scifi">Sci-Fi</SelectItem>
                    <SelectItem value="slice">Slice of Life</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="streamingService"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Streaming Service</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="crunchyroll">Crunchyroll</SelectItem>
                    <SelectItem value="funimation">Funimation</SelectItem>
                    <SelectItem value="netflix">Netflix</SelectItem>
                    <SelectItem value="hulu">Hulu</SelectItem>
                    <SelectItem value="amazon">Amazon Prime</SelectItem>
                    <SelectItem value="hidive">HIDIVE</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="coverArtUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Art</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-full h-64 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                      {imagePreview || field.value ? (
                        <img
                          src={imagePreview || field.value}
                          alt="Anime cover preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Upload anime cover
                          </p>
                        </div>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, field)}
                      className="max-w-sm"
                    />
                    <Input
                      type="text"
                      placeholder="Or enter image URL"
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setImagePreview(null);
                      }}
                      className="max-w-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter anime description"
                    className="h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );

  const renderSongForm = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Song Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter song title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="artist"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Artist</FormLabel>
                <FormControl>
                  <Input placeholder="Enter artist name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="album"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Album</FormLabel>
                <FormControl>
                  <Input placeholder="Enter album name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="releaseYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Release Year</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 2023" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pop">Pop</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="hiphop">Hip Hop</SelectItem>
                    <SelectItem value="rnb">R&B</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="classical">Classical</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="streamingPlatform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Streaming Platform</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="spotify">Spotify</SelectItem>
                    <SelectItem value="applemusic">Apple Music</SelectItem>
                    <SelectItem value="youtube">YouTube Music</SelectItem>
                    <SelectItem value="amazonmusic">Amazon Music</SelectItem>
                    <SelectItem value="tidal">Tidal</SelectItem>
                    <SelectItem value="soundcloud">SoundCloud</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="albumArtUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Album Art</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-full h-64 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                      {imagePreview || field.value ? (
                        <img
                          src={imagePreview || field.value}
                          alt="Album art preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Upload album art
                          </p>
                        </div>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, field)}
                      className="max-w-sm"
                    />
                    <Input
                      type="text"
                      placeholder="Or enter image URL"
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setImagePreview(null);
                      }}
                      className="max-w-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );

  const renderVideoForm = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter video title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="creator"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Creator</FormLabel>
                <FormControl>
                  <Input placeholder="Enter creator name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video URL</FormLabel>
                <FormControl>
                  <Input placeholder="Enter video URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="thumbnailUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thumbnail</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-full h-64 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                      {imagePreview || field.value ? (
                        <img
                          src={imagePreview || field.value}
                          alt="Video thumbnail preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Upload thumbnail
                          </p>
                        </div>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, field)}
                      className="max-w-sm"
                    />
                    <Input
                      type="text"
                      placeholder="Or enter image URL"
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setImagePreview(null);
                      }}
                      className="max-w-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter video description"
                    className="h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );

  const renderFormByType = () => {
    switch (contentType) {
      case "movie":
        return renderMovieForm();
      case "book":
        return renderBookForm();
      case "anime":
        return renderAnimeForm();
      case "song":
        return renderSongForm();
      case "video":
        return renderVideoForm();
      default:
        return renderMovieForm();
    }
  };

  return (
    <div className="bg-white dark:bg-muted p-6 rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <h2 className="text-2xl font-bold">
          {contentType.charAt(0).toUpperCase() + contentType.slice(1)} Details
        </h2>
        <Button variant="ghost" size="sm" className="ml-2">
          <Info className="h-4 w-4" />
          <span className="sr-only">Info</span>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {renderFormByType()}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit">Next</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ContentDetailsForm;

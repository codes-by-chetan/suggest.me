/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Film, CalendarIcon, User, Tag } from "lucide-react";

interface MovieDetailsFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onBack?: () => void;
}

const MovieDetailsForm = ({
  initialData = {},
  onSubmit,
  onBack = () => {},
}: MovieDetailsFormProps) => {
  const [formData, setFormData] = React.useState({
    title: initialData.title || "",
    director: initialData.director || initialData.creator || "",
    year: initialData.year || "",
    genre: initialData.genre || "",
    description: initialData.description || "",
    imageUrl: initialData.imageUrl || "",
    whereToWatch: initialData.whereToWatch || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, type: "movie" });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white dark:bg-muted p-6 rounded-lg shadow-md"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-full">
          <Film className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold">Movie Details</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Movie Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter movie title"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="director">Director</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="director"
                name="director"
                value={formData.director}
                onChange={handleChange}
                placeholder="Director name"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="year">Release Year</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="Year of release"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="genre">Genre</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                placeholder="Movie genre"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="whereToWatch">Where to Watch</Label>
            <Input
              id="whereToWatch"
              name="whereToWatch"
              value={formData.whereToWatch}
              onChange={handleChange}
              placeholder="Netflix, Amazon Prime, etc."
            />
          </div>
        </div>

        <div>
          <Label htmlFor="imageUrl">Movie Poster URL</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/movie-poster.jpg"
          />
          {formData.imageUrl && (
            <div className="mt-2 w-24 h-32 overflow-hidden rounded border">
              <img
                src={formData.imageUrl}
                alt="Movie poster preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/150?text=Invalid+URL";
                }}
              />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the movie"
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Save Movie Details</Button>
      </div>
    </form>
  );
};

export default MovieDetailsForm;

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Music, CalendarIcon, User, Tag } from "lucide-react";

interface MusicDetailsFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onBack?: () => void;
}

const MusicDetailsForm = ({
  initialData = {},
  onSubmit,
  onBack = () => {},
}: MusicDetailsFormProps) => {
  const [formData, setFormData] = React.useState({
    title: initialData.title || "",
    artist: initialData.artist || initialData.creator || "",
    album: initialData.album || "",
    releaseYear: initialData.releaseYear || initialData.year || "",
    genre: initialData.genre || "",
    description: initialData.description || "",
    coverUrl: initialData.coverUrl || initialData.imageUrl || "",
    duration: initialData.duration || "",
    whereToListen: initialData.whereToListen || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, type: "music" });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white dark:bg-muted p-6 rounded-lg shadow-md"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-full">
          <Music className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold">Music Details</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Song Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter song title"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="artist">Artist</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="artist"
                name="artist"
                value={formData.artist}
                onChange={handleChange}
                placeholder="Artist name"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="album">Album</Label>
            <Input
              id="album"
              name="album"
              value={formData.album}
              onChange={handleChange}
              placeholder="Album name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="releaseYear">Release Year</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="releaseYear"
                name="releaseYear"
                value={formData.releaseYear}
                onChange={handleChange}
                placeholder="Year of release"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="genre">Genre</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                placeholder="Music genre"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="3:45"
            />
          </div>

          <div>
            <Label htmlFor="whereToListen">Where to Listen</Label>
            <Input
              id="whereToListen"
              name="whereToListen"
              value={formData.whereToListen}
              onChange={handleChange}
              placeholder="Spotify, Apple Music, etc."
            />
          </div>
        </div>

        <div>
          <Label htmlFor="coverUrl">Album Cover URL</Label>
          <Input
            id="coverUrl"
            name="coverUrl"
            value={formData.coverUrl}
            onChange={handleChange}
            placeholder="https://example.com/album-cover.jpg"
          />
          {formData.coverUrl && (
            <div className="mt-2 w-24 h-24 overflow-hidden rounded border">
              <img
                src={formData.coverUrl}
                alt="Album cover preview"
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
            placeholder="Brief description of the song"
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Save Music Details</Button>
      </div>
    </form>
  );
};

export default MusicDetailsForm;

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookOpen, CalendarIcon, User, Tag } from "lucide-react";

interface BookDetailsFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onBack?: () => void;
}

const BookDetailsForm = ({
  initialData = {},
  onSubmit,
  onBack = () => {},
}: BookDetailsFormProps) => {
  const [formData, setFormData] = React.useState({
    title: initialData.title || "",
    author: initialData.author || initialData.creator || "",
    publishYear: initialData.publishYear || initialData.year || "",
    genre: initialData.genre || "",
    description: initialData.description || "",
    coverUrl: initialData.coverUrl || initialData.imageUrl || "",
    isbn: initialData.isbn || "",
    publisher: initialData.publisher || "",
    pages: initialData.pages || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, type: "book" });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white dark:bg-muted p-6 rounded-lg shadow-md"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-full">
          <BookOpen className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold">Book Details</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Book Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter book title"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="author">Author</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Author name"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="publishYear">Publication Year</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="publishYear"
                name="publishYear"
                value={formData.publishYear}
                onChange={handleChange}
                placeholder="Year of publication"
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
                placeholder="Book genre"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              name="publisher"
              value={formData.publisher}
              onChange={handleChange}
              placeholder="Publishing company"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="isbn">ISBN</Label>
            <Input
              id="isbn"
              name="isbn"
              value={formData.isbn}
              onChange={handleChange}
              placeholder="ISBN number"
            />
          </div>

          <div>
            <Label htmlFor="pages">Number of Pages</Label>
            <Input
              id="pages"
              name="pages"
              value={formData.pages}
              onChange={handleChange}
              placeholder="Page count"
              type="number"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="coverUrl">Book Cover URL</Label>
          <Input
            id="coverUrl"
            name="coverUrl"
            value={formData.coverUrl}
            onChange={handleChange}
            placeholder="https://example.com/book-cover.jpg"
          />
          {formData.coverUrl && (
            <div className="mt-2 w-24 h-32 overflow-hidden rounded border">
              <img
                src={formData.coverUrl}
                alt="Book cover preview"
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
            placeholder="Brief description of the book"
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Save Book Details</Button>
      </div>
    </form>
  );
};

export default BookDetailsForm;

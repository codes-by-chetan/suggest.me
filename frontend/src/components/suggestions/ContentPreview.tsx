/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ExternalLink, Info, MapPin, User } from "lucide-react"

interface ContentItem {
  id: string
  title: string
  type: string
  imageUrl?: string
  year?: string
  creator?: string
  description?: string
  [key: string]: any
}

interface ContentPreviewProps {
  content: ContentItem
  contentType: string
  onBack?: () => void
  onNext?: () => void
  hideButtons?: boolean // Add this prop
}

const ContentPreview = ({
  content,
  contentType,
  onBack = () => {},
  onNext = () => {},
  hideButtons = false,
}: ContentPreviewProps) => {
  const renderMoviePreview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        {content.imageUrl ? (
          <img
            src={content.imageUrl || "/placeholder.svg"}
            alt={content.title}
            className="w-full h-auto rounded-md shadow-md object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-muted rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">No image available</p>
          </div>
        )}
      </div>
      <div className="md:col-span-2 space-y-4">
        <h2 className="text-2xl font-bold">{content.title}</h2>

        <div className="flex items-center text-muted-foreground gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>{content.year || "Unknown year"}</span>
        </div>

        <div className="flex items-center text-muted-foreground gap-2">
          <User className="h-4 w-4" />
          <span>{content.creator || "Unknown director"}</span>
        </div>

        {content.genre && (
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">{content.genre}</span>
          </div>
        )}

        {content.whereToWatch && (
          <div className="flex items-center text-muted-foreground gap-2">
            <MapPin className="h-4 w-4" />
            <span>Watch on {content.whereToWatch}</span>
          </div>
        )}

        {content.description && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-muted-foreground">{content.description}</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderBookPreview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        {content.coverUrl || content.imageUrl ? (
          <img
            src={content.coverUrl || content.imageUrl}
            alt={content.title}
            className="w-full h-auto rounded-md shadow-md object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-muted rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">No cover available</p>
          </div>
        )}
      </div>
      <div className="md:col-span-2 space-y-4">
        <h2 className="text-2xl font-bold">{content.title}</h2>

        <div className="flex items-center text-muted-foreground gap-2">
          <User className="h-4 w-4" />
          <span>{content.author || "Unknown author"}</span>
        </div>

        <div className="flex items-center text-muted-foreground gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>{content.publishYear || "Unknown year"}</span>
        </div>

        {content.genre && (
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">{content.genre}</span>
          </div>
        )}

        {content.whereToPurchase && (
          <div className="flex items-center text-muted-foreground gap-2">
            <ExternalLink className="h-4 w-4" />
            <span>Available on {content.whereToPurchase}</span>
          </div>
        )}

        {content.description && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-muted-foreground">{content.description}</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderPreviewByType = () => {
    switch (contentType) {
      case "movie":
        return renderMoviePreview()
      case "book":
        return renderBookPreview()
      default:
        return renderMoviePreview()
    }
  }

  return (
    <div className="bg-white dark:bg-muted p-6 rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <h2 className="text-2xl font-bold">{contentType.charAt(0).toUpperCase() + contentType.slice(1)} Preview</h2>
        <Button variant="ghost" size="sm" className="ml-2">
          <Info className="h-4 w-4" />
          <span className="sr-only">Info</span>
        </Button>
      </div>

      {renderPreviewByType()}

      {!hideButtons && (
        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="button" onClick={onNext}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

export default ContentPreview

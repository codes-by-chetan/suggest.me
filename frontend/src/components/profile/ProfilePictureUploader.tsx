import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Upload, Check, X, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import "react-image-crop/dist/ReactCrop.css"

interface ProfilePictureUploaderProps {
  onImageSubmit: (formData: FormData) => Promise<void>
  currentAvatar?: string
  isLoading?: boolean
  userInitials?: string
}

const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
  onImageSubmit,
  currentAvatar,
  isLoading = false,
  userInitials = "US",
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [imageLoaded, setImageLoaded] = useState(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle dialog open
  const handleOpenDialog = () => {
    setIsOpen(true)
    setActiveTab("upload")
    setImageSrc(null)
    setOriginalFile(null)
    setImageLoaded(false)
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Store the original file for later use
    setOriginalFile(file)

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size should be less than 10MB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setActiveTab("crop")
      setImageLoaded(false) // Reset image loaded state
    }
    reader.readAsDataURL(file)
  }

  // Fit image to container when loaded
  useEffect(() => {
    if (!imageLoaded || !imgRef.current || !containerRef.current) return

    const img = imgRef.current
    const container = containerRef.current

    // Get available container dimensions
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // Maximum allowable dimension (maintain aspect ratio)
    const maxDimension = Math.min(containerWidth - 40, containerHeight - 40, 500)

    // Calculate scale factor to fit image within container
    const scaleX = maxDimension / img.naturalWidth
    const scaleY = maxDimension / img.naturalHeight
    const scale = Math.min(scaleX, scaleY)

    // Apply scaling
    if (scale < 1) {
      img.style.width = `${img.naturalWidth * scale}px`
      img.style.height = `${img.naturalHeight * scale}px`
    } else {
      // Limit even smaller images to a reasonable size
      const maxSize = Math.min(img.naturalWidth, img.naturalHeight, 400)
      const smallScale = maxSize / Math.max(img.naturalWidth, img.naturalHeight)
      img.style.width = `${img.naturalWidth * smallScale}px`
      img.style.height = `${img.naturalHeight * smallScale}px`
    }

    // Recalculate crop after resizing
    requestAnimationFrame(() => {
      const { width, height } = img
      const cropSize = Math.min(width, height) * 0.8
      const x = (width - cropSize) / 2
      const y = (height - cropSize) / 2

      setCrop({
        unit: "px",
        width: cropSize,
        height: cropSize,
        x,
        y,
      })
    })
  }, [imageLoaded])

  // Handle image load for cropping
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget
    setImageLoaded(true)
  }, [])

  // Get cropped image while preserving original format
  const getCroppedImg = async (): Promise<Blob> => {
    if (!imgRef.current || !completedCrop || !originalFile) {
      throw new Error("Crop not complete")
    }

    const image = imgRef.current
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("No 2d context")
    }

    // Calculate scaling factors
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    // Set canvas size to desired output size
    canvas.width = 500
    canvas.height = 500

    // Draw the cropped image on the canvas
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    // Determine output format based on original file
    const isGif = originalFile.type === "image/gif"

    // For GIFs, we need to return the original file with cropping metadata
    // This is a simplified approach - in a real implementation, you'd need a server-side
    // component that can crop GIFs while preserving animation
    if (isGif) {
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, "image/gif")
      })
    }

    // For other formats, return a JPEG blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
        },
        "image/jpeg",
        0.95,
      )
    })
  }

  // Handle crop completion and submission
  const handleSubmit = async () => {
    if (!completedCrop || !originalFile || isLoading) return

    try {
      const croppedBlob = await getCroppedImg()

      // Determine file extension based on original file
      const isGif = originalFile.type === "image/gif"
      const fileName = isGif ? "profile-picture.gif" : "profile-picture.jpg"

      // Create a new file with the correct type
      const fileType = isGif ? "image/gif" : "image/jpeg"
      const croppedFile = new File([croppedBlob], fileName, { type: fileType })

      // Create form data and submit
      const formData = new FormData()
      formData.append("avatar", croppedFile)

      await onImageSubmit(formData)
      setIsOpen(false)
    } catch (error) {
      console.error("Error processing image:", error)
      alert("Failed to process image. Please try again.")
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-md hover:bg-primary/90"
        onClick={handleOpenDialog}
      >
        <Camera className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md" aria-description="profile-picture-dialog">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="crop" disabled={!imageSrc}>
                Crop
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="py-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32 border-2 border-muted">
                  {currentAvatar ? (
                    <AvatarImage src={currentAvatar || "/placeholder.svg"} alt="Current profile picture" />
                  ) : (
                    <AvatarFallback className="text-4xl">{userInitials}</AvatarFallback>
                  )}
                </Avatar>

                <div className="flex flex-col gap-2 items-center">
                  <Button onClick={() => fileInputRef.current?.click()} className="flex gap-2">
                    <Upload className="h-4 w-4" />
                    Select Image
                  </Button>
                  <p className="text-sm text-muted-foreground">JPG, PNG, or GIF. Max 10MB.</p>
                </div>

                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
              </div>
            </TabsContent>

            <TabsContent value="crop" className="py-4">
              {imageSrc && (
                <div className="flex flex-col gap-4">
                  <div ref={containerRef} className="relative h-[350px] flex items-center justify-center">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={1}
                      circularCrop
                      minWidth={50}
                    >
                      <img
                        ref={imgRef}
                        src={imageSrc || "/placeholder.svg"}
                        alt="Crop preview"
                        onLoad={onImageLoad}
                        className="object-contain"
                      />
                    </ReactCrop>
                  </div>

                  <div className="flex justify-between gap-2 pt-2">
                    <Button variant="outline" onClick={() => setActiveTab("upload")}>
                      <X className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button onClick={handleSubmit} disabled={!completedCrop || isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" /> Apply & Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProfilePictureUploader

import React, { useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";
import UserService from "@/services/user.service";

// Validation schema using Zod based on UserProfile model
const profileSchema = z.object({
  bio: z.string().max(200, "Bio cannot exceed 200 characters").optional(),
  displayName: z
    .string()
    .max(50, "Display name cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only alphabets, numbers, -, _ are allowed")
    .optional(),
  socialLinks: z
    .object({
      twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
      instagram: z.string().url("Invalid Instagram URL").optional().or(z.literal("")),
      website: z.string().url("Invalid Website URL").optional().or(z.literal("")),
    })
    .optional(),
  preferences: z
    .object({
      favoriteGenres: z.array(z.string()).optional(),
      preferredContentTypes: z
        .array(z.enum(["Movie", "Series", "Book", "Music", ""]))
        .optional(),
    })
    .optional(),
  isPublic: z.boolean().default(true),
  isVerified: z.boolean().default(false),
});

// Type for form data
type ProfileFormData = z.infer<typeof profileSchema>;

// Type for content types
type ContentType = "" | "Movie" | "Series" | "Book" | "Music";

// Interface for API response
interface UserProfileResponse {
  bio?: string;
  displayName?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  preferences?: {
    favoriteGenres?: string[];
    preferredContentTypes?: ContentType[];
  };
  isPublic?: boolean;
  isVerified?: boolean;
}

// Logger for development
const log = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args);
  }
};

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const userService = new UserService();

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
    control,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      isPublic: true,
      isVerified: false,
      socialLinks: {
        twitter: "",
        instagram: "",
        website: "",
      },
      preferences: {
        favoriteGenres: [],
        preferredContentTypes: [],
      },
    },
  });

  // Fetch profile data
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const userId = "507f1f77bcf86cd799439011"; // Replace with auth context
      log("Fetching profile for user:", userId);
      const response = await userService.getUserWholeProfile();
      if (!response.success) {
        throw new Error("Failed to fetch profile");
      }
      const profile = response.data as UserProfileResponse;
      console.log(profile)
      // Validate and filter preferredContentTypes
      const validContentTypes = (profile.preferences?.preferredContentTypes || []).filter(
        (type): type is ContentType =>
          ["Movie", "Series", "Book", "Music", ""].includes(type)
      );

      // Set form values
      setValue("bio", profile.bio || "");
      setValue("displayName", profile.displayName || "");
      setValue("socialLinks.twitter", profile.socialLinks?.twitter || "");
      setValue("socialLinks.instagram", profile.socialLinks?.instagram || "");
      setValue("socialLinks.website", profile.socialLinks?.website || "");
      setValue("preferences.favoriteGenres", profile.preferences?.favoriteGenres || []);
      setValue("preferences.preferredContentTypes", validContentTypes);
      setValue("isPublic", profile.isPublic);
      setValue("isVerified", profile.isVerified);
    } catch (error) {
      log("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Handle form submission
  const onSubmit = useCallback(
    async (data: ProfileFormData) => {
      try {
        const userId = "507f1f77bcf86cd799439011"; // Replace with auth context
        log("Submitting profile update:", data);
        // Assuming UserService has an updateUserProfile method
        const response = await userService.updateUserProfile(data); // Replace with actual method
        if (!response.success) {
          throw new Error("Failed to update profile");
        }
        toast({
          title: "Success",
          description: "Profile updated successfully.",
        });
        navigate("/profile");
      } catch (error) {
        log("Error updating profile:", error);
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    },
    []
  );

  // Memoized content types for checkboxes
  const contentTypes = useMemo<ContentType[]>(() => ["Movie", "Series", "Book", "Music"], []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (

      <main className="w-full mx-auto pb-[10vh] pt-0 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/profile")}
          aria-label="Back to profile"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  {...register("displayName")}
                  placeholder="Enter display name"
                  aria-invalid={!!errors.displayName}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName.message}</p>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  {...register("bio")}
                  placeholder="Tell us about yourself"
                  aria-invalid={!!errors.bio}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
              </div>

              {/* Social Links */}
              <div className="space-y-2">
                <Label>Social Links</Label>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="socialLinks.twitter">Twitter</Label>
                    <Input
                      id="socialLinks.twitter"
                      {...register("socialLinks.twitter")}
                      placeholder="https://twitter.com/username"
                      aria-invalid={!!errors.socialLinks?.twitter}
                    />
                    {errors.socialLinks?.twitter && (
                      <p className="text-sm text-destructive">
                        {errors.socialLinks.twitter.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="socialLinks.instagram">Instagram</Label>
                    <Input
                      id="socialLinks.instagram"
                      {...register("socialLinks.instagram")}
                      placeholder="https://instagram.com/username"
                      aria-invalid={!!errors.socialLinks?.instagram}
                    />
                    {errors.socialLinks?.instagram && (
                      <p className="text-sm text-destructive">
                        {errors.socialLinks.instagram.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="socialLinks.website">Website</Label>
                    <Input
                      id="socialLinks.website"
                      {...register("socialLinks.website")}
                      placeholder="https://yourwebsite.com"
                      aria-invalid={!!errors.socialLinks?.website}
                    />
                    {errors.socialLinks?.website && (
                      <p className="text-sm text-destructive">
                        {errors.socialLinks.website.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-2">
                <Label>Preferences</Label>
                <div className="space-y-4">
                  {/* Favorite Genres */}
                  <div>
                    <Label htmlFor="preferences.favoriteGenres">Favorite Genres</Label>
                    <Input
                      id="preferences.favoriteGenres"
                      placeholder="Sci-Fi, Fantasy, Thriller"
                      onChange={(e) =>
                        setValue(
                          "preferences.favoriteGenres",
                          e.target.value
                            .split(",")
                            .map((g) => g.trim())
                            .filter((g) => g)
                        )
                      }
                      defaultValue={getValues("preferences.favoriteGenres")?.join(", ")}
                      aria-invalid={!!errors.preferences?.favoriteGenres}
                    />
                    {errors.preferences?.favoriteGenres && (
                      <p className="text-sm text-destructive">
                        {errors.preferences.favoriteGenres.message}
                      </p>
                    )}
                  </div>

                  {/* Preferred Content Types */}
                  <div>
                    <Label>Preferred Content Types</Label>
                    <div className="space-y-2">
                      {contentTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Controller
                            name="preferences.preferredContentTypes"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                id={`preferredContentTypes-${type}`}
                                checked={field.value?.includes(type)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  field.onChange(
                                    checked
                                      ? [...current, type]
                                      : current.filter((t) => t !== type)
                                  );
                                }}
                              />
                            )}
                          />
                          <Label htmlFor={`preferredContentTypes-${type}`}>{type}</Label>
                        </div>
                      ))}
                    </div>
                    {errors.preferences?.preferredContentTypes && (
                      <p className="text-sm text-destructive">
                        {errors.preferences.preferredContentTypes.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Is Public */}
              <div className="flex items-center space-x-2">
                <Controller
                  name="isPublic"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isPublic"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                      aria-label="Make profile public"
                    />
                  )}
                />
                <Label htmlFor="isPublic">Public Profile</Label>
              </div>

              {/* Is Verified (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="isVerified">Verified Status</Label>
                <Input
                  id="isVerified"
                  value={getValues("isVerified") ? "Verified" : "Not Verified"}
                  disabled
                  aria-readonly
                />
              </div>

              {/* Form Actions */}
              <div className="pt-4 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/profile")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
  );
};

export default EditProfile;
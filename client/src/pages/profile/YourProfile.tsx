import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Grid3X3,
  Bookmark,
  UserCheck,
  Users,
  Edit,
  Upload,
  X,
} from "lucide-react";
import YourPosts from "./YourPosts";
import FriendRequests from "./FriendRequests";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/axiosinstance";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function YourProfile() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  // State to hold the fetched user data
  const [userData, setUserData] = useState({
    postsCount: 0,
    friendsCount: 0,
    aboutMe: "",
    createdAt: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Avatar related states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || "");
  const [openAvatarDialog, setOpenAvatarDialog] = useState(false);

  // Edit profile dialog states
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    newPassword: "",
    bio: "",
  });

  // Avatar update mutation
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.put("/verifiedUser/updateAvatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    },
    onSuccess: (data) => {
      if (user) {
        setUser({
          ...user,
          avatar: data.avatar,
        });
      }

      setOpenAvatarDialog(false);
      setImageFile(null);
      setPreviewUrl(data.avatar);

      // Invalidate relevant queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Avatar updated successfully!");
    },
    onError: (error: any) => {
      console.error("Error updating avatar:", error);
      toast.error("Failed to update avatar. Please try again.");
    },
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (profileData: {
      name: string;
      newPassword: string;
      bio: string;
    }) => {
      const response = await api.put("/verifiedUser/updateProfile", {
        name: profileData.name.trim(),
        newPassword: profileData.newPassword.trim(),
        bio: profileData.bio.trim(),
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Update user state with new data
      if (user) {
        setUser({
          ...user,
          name: data.user.name,
        });
      }

      // Update local userData state with new bio
      setUserData(prev => ({
        ...prev,
        aboutMe: editFormData.bio.trim(),
      }));

      // Close the dialog
      setOpenEditDialog(false);
      toast.success("Profile updated successfully!");

      // Invalidate relevant queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["fullUserData"] });
    },
    onError: (error: any) => {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.", {
        description: error.response?.data?.message || "Please try again later.",
      });
    },
  });

  const getFullUserData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/verifiedUser/getFullUserData");

      if (res.data.userData) {
        setUserData({
          postsCount: res.data.userData.postsCount || 0,
          friendsCount: res.data.userData.friendsCount || 0,
          aboutMe: res.data.userData.aboutMe || "",
          createdAt: res.data.userData.createdAt || null,
        });

        // Update edit form data with current user data
        setEditFormData({
          name: user?.name || "",
          newPassword: "",
          bio: res.data.userData.aboutMe || "",
        });
      }
    } catch (error) {
      // Handle error silently or show user-friendly message
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getFullUserData();
  }, [user?.id]);

  // Handle dropzone file change
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        if (e.target && e.target.result) {
          setPreviewUrl(e.target.result as string);
        }
      };
      fileReader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxSize: 5242880, // 5MB
    multiple: false,
  });

  // Handle avatar update using mutation
  const handleAvatarUpdate = () => {
    if (!imageFile) return;
    avatarMutation.mutate(imageFile);
  };

  // Handle edit profile form submission using mutation
  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one field has content
    if (
      editFormData.name.trim() === "" &&
      editFormData.bio.trim() === "" &&
      editFormData.newPassword.trim() === ""
    ) {
      toast.error("Please fill in at least one field to update.");
      return;
    }

    profileMutation.mutate({
      name: editFormData.name,
      newPassword: editFormData.newPassword,
      bio: editFormData.bio,
    });
  };

  // Handle input changes for edit form
  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Format the creation date
  const formatJoinDate = (dateString: any) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `Joined ${date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Profile Picture */}
        <div className="flex justify-center md:justify-start relative">
          <div className="relative">
            <Avatar className="w-32 h-32 md:w-40 md:h-40">
              <AvatarImage
                src={user?.avatar || ""}
                alt={user?.name || "User"}
              />
              <AvatarFallback className="text-2xl">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : "U"}
              </AvatarFallback>
            </Avatar>

            {/* Change Avatar Button */}
            <Dialog open={openAvatarDialog} onOpenChange={setOpenAvatarDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs px-3 py-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Change
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Change Profile Picture</DialogTitle>
                  <DialogDescription>
                    Upload a new image for your profile
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex justify-center py-4">
                    <Avatar className="h-32 w-32 ring-4 ring-primary/10">
                      <AvatarImage
                        src={previewUrl}
                        alt={user?.name || "User"}
                      />
                      <AvatarFallback className="text-4xl bg-primary/10">
                        {user?.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div
                    {...getRootProps()}
                    className="border-2 border-dashed border-primary/50 rounded-lg p-6 text-center hover:bg-muted/50 transition cursor-pointer"
                  >
                    <input {...getInputProps()} />
                    {isDragActive ? (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-primary animate-pulse" />
                        <p>Drop the image here...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p>Drag & drop an image here, or click to select</p>
                        <p className="text-xs text-muted-foreground">
                          Supports JPG, PNG, GIF up to 5MB
                        </p>
                      </div>
                    )}
                  </div>

                  {imageFile && (
                    <div className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                      <div className="flex items-center gap-2 truncate">
                        <div className="h-10 w-10 shrink-0 rounded-md bg-background flex items-center justify-center">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-8 w-8 object-cover rounded"
                          />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-sm font-medium truncate">
                            {imageFile.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(imageFile.size / 1024 / 1024).toFixed(2)}MB
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setPreviewUrl(user?.avatar || "");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOpenAvatarDialog(false);
                      setPreviewUrl(user?.avatar || "");
                      setImageFile(null);
                    }}
                    disabled={avatarMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAvatarUpdate}
                    disabled={!imageFile || avatarMutation.isPending}
                  >
                    {avatarMutation.isPending ? "Uploading..." : "Save Avatar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 space-y-4">
          {/* Username and Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-light">
                {user?.username || "username"}
              </h1>
              {user?.isEmailVerified && (
                <Badge variant="default" className="text-xs">
                  Verified ✅
                </Badge>
              )}
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your profile information
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditProfileSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Name</Label>
                      <Input
                        id="edit-name"
                        value={editFormData.name}
                        onChange={(e) =>
                          handleEditInputChange("name", e.target.value)
                        }
                        placeholder="Enter your name"
                        disabled={profileMutation.isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-password">New Password</Label>
                      <Input
                        id="edit-password"
                        type="password"
                        value={editFormData.newPassword}
                        onChange={(e) =>
                          handleEditInputChange("newPassword", e.target.value)
                        }
                        placeholder="Enter new password"
                        disabled={profileMutation.isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-bio">Bio</Label>
                      <Textarea
                        id="edit-bio"
                        value={editFormData.bio}
                        onChange={(e) =>
                          handleEditInputChange("bio", e.target.value)
                        }
                        placeholder="Tell us about yourself"
                        rows={3}
                        disabled={profileMutation.isPending}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenEditDialog(false)}
                      disabled={profileMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        profileMutation.isPending ||
                        (editFormData.name.trim() === "" &&
                          editFormData.bio.trim() === "" &&
                          editFormData.newPassword.trim() === "")
                      }
                    >
                      {profileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="flex gap-8 justify-center sm:justify-start">
            <div className="text-center">
              <div className="font-semibold text-lg">
                {isLoading ? "..." : userData.postsCount}
              </div>
              <div className="text-sm text-muted-foreground">posts</div>
            </div>
            <div className="text-center cursor-pointer hover:opacity-70">
              <div className="font-semibold text-lg">
                {isLoading ? "..." : userData.friendsCount.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">friends</div>
            </div>
          </div>

          {/* Bio and Join Date */}
          <div className="space-y-1">
            <div className="font-semibold">{user?.name || "Your Name"}</div>
            <div className="text-sm whitespace-pre-line">
              {isLoading
                ? "Loading..."
                : userData.aboutMe || "Welcome to my profile! 👋"}
            </div>
            {userData.createdAt && (
              <div className="text-xs text-muted-foreground">
                {formatJoinDate(userData.createdAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="flex justify-center bg-transparent border-b w-full h-auto p-0 mb-8">
          <div className="flex gap-16">
            <TabsTrigger
              value="posts"
              className="flex items-center gap-2 text-sm font-medium pt-4 pb-2 bg-transparent data-[state=active]:border-t-2 data-[state=active]:border-black data-[state=active]:shadow-none data-[state=active]:bg-transparent border-t-2 border-transparent text-muted-foreground data-[state=active]:text-foreground hover:text-foreground"
            >
              <Grid3X3 className="w-4 h-4" />
              POSTS
            </TabsTrigger>

            <TabsTrigger
              value="saved"
              className="flex items-center gap-2 text-sm font-medium pt-4 pb-2 bg-transparent data-[state=active]:border-t-2 data-[state=active]:border-black data-[state=active]:shadow-none data-[state=active]:bg-transparent border-t-2 border-transparent text-muted-foreground data-[state=active]:text-foreground hover:text-foreground"
            >
              <Bookmark className="w-4 h-4" />
              SAVED
            </TabsTrigger>

            <TabsTrigger
              value="requests"
              className="flex items-center gap-2 text-sm font-medium pt-4 pb-2 bg-transparent data-[state=active]:border-t-2 data-[state=active]:border-black data-[state=active]:shadow-none data-[state=active]:bg-transparent border-t-2 border-transparent text-muted-foreground data-[state=active]:text-foreground hover:text-foreground relative"
            >
              <Users className="w-4 h-4" />
              REQUESTS
            </TabsTrigger>
          </div>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          <YourPosts />
        </TabsContent>

        <TabsContent value="saved" className="mt-0">
          <div className="text-center py-12 text-muted-foreground">
            <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No saved posts yet</p>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-0">
          <FriendRequests />
        </TabsContent>
      </Tabs>
    </div>
  );
}

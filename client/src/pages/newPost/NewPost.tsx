"use client";

import React, { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { ClipLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X, Upload, Image as ImageIcon, Plus } from "lucide-react";
import api from "@/lib/axiosinstance";
import { toast } from "sonner";

interface PostImage {
  file: File;
  preview: string;
  id: string;
}

interface PostData {
  description: string;
  tags: string[];
  images: File[];
}

export default function NewPost() {
  const [images, setImages] = useState<PostImage[]>([]);
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create post mutation function
  const createPost = async (postData: PostData) => {
    const formData = new FormData();
    formData.append("description", postData.description.trim());
    formData.append("tags", JSON.stringify(postData.tags));
    postData.images.forEach((img) => formData.append("images", img));

    // Debug: log the FormData entries
    console.log("FormData Preview:");
    for (const [key, value] of formData.entries()) {
      if (key === "images" && value instanceof File) {
        console.log(key, value.name, value.type, value.size);
      } else {
        console.log(key, value);
      }
    }

    const response = await api.post("/verifiedUser/addNewPost", formData);
    return response.data;
  };

  // useMutation hook
  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      console.log("✅ Post created successfully:", data);
      toast.success("Post created successfully!");
      // Reset form
      setImages([]);
      setDescription("");
      setTags([]);
      setTagInput("");
    },
    onError: (error: any) => {
      console.error("❌ Error submitting post:", error);
      toast.error("Failed to create post", {
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage: PostImage = {
            file,
            preview: e.target?.result as string,
            id: Math.random().toString(36).substr(2, 9),
          };
          setImages((prev) => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage: PostImage = {
            file,
            preview: e.target?.result as string,
            id: Math.random().toString(36).substr(2, 9),
          };
          setImages((prev) => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags((prev) => [...prev, tagInput.trim().toLowerCase()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    mutation.mutate({
      description,
      tags,
      images: images.map(img => img.file)
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            Create New Post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Section */}
            <div className="space-y-4">
              <Label htmlFor="images">Images</Label>
              
              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Dropzone Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                {isDragActive ? (
                  <p className="text-sm text-blue-600">Drop the images here...</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-1">
                      Drag & drop images here, or click to select
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, GIF up to 10MB each
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What's on your mind?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Tags Section */}
            <div className="space-y-4">
              <Label htmlFor="tags">Tags</Label>

              {/* Tag Input */}
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add a tag (e.g., food, lifestyle, tech)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Tag Display */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      #{tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Error Display */}
            {mutation.isError && (
              <div className="text-red-600 text-sm">
                {mutation.error?.message || "An error occurred"}
              </div>
            )}

            {/* Submit Button with Loading Spinner */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <div className="flex items-center gap-2">
                  <ClipLoader 
                    color="#ffffff" 
                    loading={mutation.isPending} 
                    size={20} 
                  />
                  Creating Post...
                </div>
              ) : (
                "Create Post"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

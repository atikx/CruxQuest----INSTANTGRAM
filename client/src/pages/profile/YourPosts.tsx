import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import api from "@/lib/axiosinstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Post {
  id: string;
  description: string;
  images: { imageUrl: string }[];
  tags: { tag: { name: string } }[];
}

export default function YourPosts() {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["yourPosts"],
    queryFn: async (): Promise<Post[]> => {
      const res = await api.get("/verifiedUser/getYourPosts");
      return res.data.posts;
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.put("/verifiedUser/deletePost", { postId });
      return res.data;
    },
    onSuccess: (_, postId) => {
      queryClient.setQueryData(["yourPosts"], (oldPosts: Post[] = []) =>
        oldPosts.filter((post) => post.id !== postId)
      );
      toast.success("Post deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete post. Please try again.");
    },
  });

  const handleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
  };

  const handleDeletePost = (postId: string) => {
    deletePostMutation.mutate(postId);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, index) => (
          <Card
            key={index}
            className="bg-gradient-to-br from-secondary/50 to-secondary border-0 shadow-xl backdrop-blur-sm overflow-hidden rounded-2xl animate-pulse"
          >
            <CardContent className="p-0">
              <div className="aspect-[5/3] bg-muted" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="flex gap-4 pt-2">
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load posts</p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["yourPosts"] })
            }
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground text-lg mb-2">No posts found</p>
          <p className="text-muted-foreground text-sm">
            Start creating posts to see them here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
      {posts.map((post) => (
        <Card
          key={post.id}
          className="bg-gradient-to-br from-secondary/50 to-secondary border-0 shadow-xl backdrop-blur-sm overflow-hidden rounded-2xl relative"
        >
          <CardContent className="p-0">
            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="absolute top-4 right-4 z-10 p-2 bg-primary text-white rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deletePostMutation.isPending}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Post</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this post? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletePostMutation.isPending}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeletePost(post.id)}
                    disabled={deletePostMutation.isPending}
                  >
                    {deletePostMutation.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Image Carousel */}
            {post.images && post.images.length > 0 && (
              <div className="relative group">
                <Carousel className="w-full">
                  <CarouselContent>
                    {post.images.map((img, index) => (
                      <CarouselItem key={index}>
                        <div className="relative aspect-[5/3] overflow-hidden">
                          <img
                            src={img.imageUrl}
                            alt={`Post ${post.id} image ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {post.images.length > 1 && (
                    <>
                      <CarouselPrevious className="absolute top-1/2 left-3 -translate-y-1/2 h-9 w-9 bg-white/50 hover:bg-white/70 border-0 backdrop-blur-sm" />
                      <CarouselNext className="absolute top-1/2 right-3 -translate-y-1/2 h-9 w-9 bg-white/50 hover:bg-white/70 border-0 backdrop-blur-sm" />
                    </>
                  )}
                </Carousel>
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-3">
              <p className="text-foreground leading-relaxed text-base line-clamp-3">
                {post.description}
              </p>

              {post.tags.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {post.tags.map((tagObj, index) => (
                    <span key={index} className="mr-2">
                      #{tagObj.tag.name}
                    </span>
                  ))}
                </p>
              )}

              <div className="flex gap-6 pt-4 border-t border-border/30 mt-3">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 transition-all duration-200 hover:scale-105 ${
                    likedPosts.has(post.id)
                      ? "text-red-500"
                      : "text-muted-foreground hover:text-red-500"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      likedPosts.has(post.id) ? "fill-current" : ""
                    }`}
                  />
                  <span className="text-sm font-medium">Like</span>
                </button>

                <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-all duration-200 hover:scale-105">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Comment</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

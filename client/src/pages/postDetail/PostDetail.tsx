import { Heart, ArrowLeft } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Comments from "./Comments";
import api from "@/lib/axiosinstance";
import { toast } from "sonner";
import ErrorBoundary from "@/components/custom/ErrorBoundary";

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

interface Image {
  imageUrl: string;
}

interface Tag {
  postId: string;
  tagId: number;
  tag: {
    name: string;
  };
}

interface Post {
  id: string;
  userId: string;
  description: string;
  createdAt: string;
  images: Image[];
  tags: Tag[];
  user: User;
  likeCount: number;
  isLiked: boolean;
}

export default function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const fetchPostDetails = async () => {
    try {
      const res = await api.get(`/verifiedUser/getPost/${id}`);
      const postData = res.data.post;
      setPost(postData);
      setIsLiked(postData.isLiked);
      setLikeCount(parseInt(postData.likeCount) || 0);
      console.log("Post details fetched:", postData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching post details:", error);
      toast.error("Failed to load post details");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [id]);

  const handleLike = async () => {
    if (isLikeLoading) return;

    setIsLikeLoading(true);

    // Store previous state for rollback
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    // Optimistic update
    setIsLiked(true);
    setLikeCount((prevCount) => prevCount + 1);

    try {
      const res = await api.post(`/verifiedUser/likePost/${id}`);

      if (res.status === 200) {
        // Update with server response if available
        if (res.data.likeCount !== undefined) {
          setLikeCount(parseInt(res.data.likeCount));
        }
        if (res.data.isLiked !== undefined) {
          setIsLiked(res.data.isLiked);
        }

        toast.success(res.data.message || "Post liked successfully!");
        console.log(res.data);
      }
    } catch (error: any) {
      console.error("Error liking post:", error);

      // Rollback optimistic update
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);

      toast.error("Failed to like post. Please try again.", {
        description: error.response?.data?.message || "Network error occurred",
      });
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleUnLike = async () => {
    if (isLikeLoading) return;

    setIsLikeLoading(true);

    // Store previous state for rollback
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    // Optimistic update
    setIsLiked(false);
    setLikeCount((prevCount) => Math.max(0, prevCount - 1));

    try {
      const res = await api.post(`/verifiedUser/unlikePost/${id}`);

      if (res.status === 200) {
        // Update with server response if available
        if (res.data.likeCount !== undefined) {
          setLikeCount(parseInt(res.data.likeCount));
        }
        if (res.data.isLiked !== undefined) {
          setIsLiked(res.data.isLiked);
        }

        toast.success(res.data.message || "Post unliked successfully!");
        console.log(res.data);
      }
    } catch (error: any) {
      console.error("Error unliking post:", error);

      // Rollback optimistic update
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);

      toast.error("Failed to unlike post. Please try again.", {
        description: error.response?.data?.message || "Network error occurred",
      });
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleBack = () => navigate(-1);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const reactions = [
    { type: "like", emoji: "❤️", color: "bg-red-500" },
    { type: "love", emoji: "😍", color: "bg-pink-500" },
    { type: "laugh", emoji: "😂", color: "bg-yellow-500" },
    { type: "wow", emoji: "😮", color: "bg-blue-500" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Post not found</h1>
          <p className="text-muted-foreground">
            The post you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Header with back button */}
      <div className="z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2 h-auto hover:bg-secondary rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Go Back</h1>
        </div>
      </div>

      <div className="flex lg:h-[93vh] flex-col lg:flex-row">
        {/* Left Side - Post Image with fixed dimensions */}
        <div className="lg:w-[70%] h-full flex items-center justify-center relative overflow-hidden">
          {post.images && post.images.length > 0 && (
            <>
              {post.images.length === 1 ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={post.images[0].imageUrl}
                    alt="Post image"
                    className="w-full h-full object-cover"
                    style={{
                      maxWidth: "100%",
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <Carousel className="w-full h-full">
                    <CarouselContent className="h-full">
                      {post.images.map((image, index) => (
                        <CarouselItem
                          key={index}
                          className="h-full flex items-center justify-center"
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={image.imageUrl}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-full object-cover"
                              style={{
                                maxWidth: "100%",
                              }}
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute top-1/2 left-4 -translate-y-1/2 h-12 w-12 bg-white/20 hover:bg-white/30 border-0 text-white backdrop-blur-sm z-10" />
                    <CarouselNext className="absolute top-1/2 right-4 -translate-y-1/2 h-12 w-12 bg-white/20 hover:bg-white/30 border-0 text-white backdrop-blur-sm z-10" />
                  </Carousel>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Side - Comments with fixed width */}
        <div className="lg:w-[30%] bg-background border-l border flex flex-col h-full">
          {/* Post Header */}
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                  {getInitials(post.user.name || post.user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <span className="font-semibold text-sm mr-2">
                  {post.user.name || post.user.username}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(post.createdAt)}
                </span>
                <br />
                <span className="text-sm">{post.description}</span>
                {post.tags.length > 0 && (
                  <span className="text-primary text-sm mt-2">
                    {post.tags.map((tag) => `#${tag.tag.name}`).join(" ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="p-4 border-t flex-shrink-0">
            <div className="flex items-center gap-2 text-sm mb-4">
              <div className="flex -space-x-1">
                {reactions.map((reaction, index) => (
                  <div
                    key={index}
                    className={`w-5 h-5 ${reaction.color} rounded-full border-2 border-background flex items-center justify-center`}
                  >
                    <span className="text-white text-xs">{reaction.emoji}</span>
                  </div>
                ))}
              </div>
              <span className="font-semibold">{likeCount} likes</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-6">
              <button
                onClick={isLiked ? handleUnLike : handleLike}
                disabled={isLikeLoading}
                className={`flex items-center gap-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLiked
                    ? "text-red-500"
                    : "text-muted-foreground hover:text-red-500"
                }`}
              >
                <Heart
                  className={`w-6 h-6 ${isLiked ? "fill-current" : ""} ${
                    isLikeLoading ? "animate-pulse" : ""
                  }`}
                />
                <span className="font-medium">
                  {isLikeLoading ? "..." : isLiked ? "Liked" : "Like"}
                </span>
              </button>
            </div>
          </div>

          {/* Nested Comments - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            <ErrorBoundary>
              <Comments postId={post.id} />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}

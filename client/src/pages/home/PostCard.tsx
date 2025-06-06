import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  userId: string;
  description: string;
  createdAt: string;
  avatar: string;
  username: string;
  name: string;
  imageUrls: string[];
  tags: string[];
  likeCount: string;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => setIsLiked(!isLiked);

  const handleCommentClick = () => {
    navigate(`/post/${post.id}`);
  };

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatHashtags = (tags: string[]) => {
    return tags.map((tag) => `#${tag}`).join(" ");
  };

  // Helper function to get display name
  const getDisplayName = () => {
    return post.name?.trim() || post.username || "Anonymous";
  };

  // Hardcoded reactions
  const reactions = [
    { type: "like", emoji: "❤️", color: "bg-red-500" },
    { type: "love", emoji: "😍", color: "bg-pink-500" },
    { type: "laugh", emoji: "😂", color: "bg-yellow-500" },
    { type: "wow", emoji: "😮", color: "bg-blue-500" },
  ];

  return (
    <Card className="bg-gradient-to-br from-secondary/50 to-secondary md:w-[48%] border-0 shadow-xl backdrop-blur-sm">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 pb-3">
          <Avatar className="ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            <AvatarImage src={post.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {post.name?.trim() ? getInitials(post.name) : getInitials(post.username || "")}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="font-semibold text-foreground">
              {getDisplayName()}
            </span>
            <div className="text-sm text-muted-foreground">
              {formatTimestamp(post.createdAt)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 h-20 pb-3">
          <p className="text-foreground leading-relaxed">
            {post.description}{" "}
            <span className="text-primary">{formatHashtags(post.tags)}</span>
          </p>
        </div>

        {/* Image Carousel */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="relative group px-4">
            <Carousel className="w-full">
              <CarouselContent>
                {post.imageUrls.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative overflow-hidden">
                      <img
                        src={image}
                        alt={`Post image ${index + 1}`}
                        className="w-full lg:h-96 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {post.imageUrls.length > 1 && (
                <>
                  <CarouselPrevious className="absolute top-1/2 left-3 -translate-y-1/2 h-10 w-10 bg-white/40 hover:bg-white/60 border-0 backdrop-blur-sm" />
                  <CarouselNext className="absolute top-1/2 right-3 -translate-y-1/2 h-10 w-10 bg-white/40 hover:bg-white/60 border-0 backdrop-blur-sm" />
                </>
              )}
            </Carousel>
          </div>
        )}

        {/* Engagement Stats with Hardcoded Reactions */}
        <div className="px-4 py-2 border-b border-border/50">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  {reactions.map((reaction, index) => (
                    <div
                      key={index}
                      className={`w-5 h-5 ${reaction.color} rounded-full border-2 border-background flex items-center justify-center`}
                    >
                      <span className="text-white text-xs">
                        {reaction.emoji}
                      </span>
                    </div>
                  ))}
                </div>
                <span className="ml-2">{post.likeCount} likes</span>
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-6 p-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-all duration-200 hover:scale-105 ${
              isLiked
                ? "text-red-500"
                : "text-muted-foreground hover:text-red-500"
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            <span className="text-sm font-medium">Like</span>
          </button>

          <button
            onClick={handleCommentClick}
            className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-all duration-200 hover:scale-105"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

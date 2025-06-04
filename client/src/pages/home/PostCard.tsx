import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Bookmark, MapPin, Verified } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useState } from "react";

interface User {
  name: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  isPro: boolean;
  isOnline: boolean;
  location: string;
}

interface Post {
  id: number;
  user: User;
  content: string;
  hashtags: string[];
  images: string[];
  timestamp: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    reactions: Array<{
      type: string;
      emoji: string;
      color: string;
    }>;
  };
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => setIsLiked(!isLiked);
  const handleSave = () => setIsSaved(!isSaved);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className=" bg-gradient-to-br from-secondary/50 to-secondary md:w-[48%] border-0 shadow-xl backdrop-blur-sm">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getInitials(post.user.name)}
                </AvatarFallback>
              </Avatar>
              {post.user.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {post.user.name}
                </span>
                {post.user.isVerified && (
                  <Verified className="w-4 h-4 text-blue-500 fill-current" />
                )}
                {post.user.isPro && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    Pro
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{post.timestamp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 h-20 pb-3">
          <p className="text-foreground leading-relaxed">
            {post.content}{" "}
            <span className="text-primary">{post.hashtags.join(" ")}</span>
          </p>
        </div>

        {/* Image Carousel */}
        {post.images && post.images.length > 0 && (
          <div className="relative group px-4">
            <Carousel className="w-full">
              <CarouselContent>
                {post.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative overflow-hidden">
                      <img
                        src={image}
                        alt={`Post image ${index + 1}`}
                        className="w-full lg:h-96  object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {post.images.length > 1 && (
                <>
                  <CarouselPrevious className="absolute top-1/2 left-3 -translate-y-1/2 h-10 w-10 bg-black/40 hover:bg-black/60 border-0 backdrop-blur-sm" />
                  <CarouselNext className="absolute top-1/2 right-3 -translate-y-1/2 h-10 w-10 bg-black/40 hover:bg-black/60 border-0 backdrop-blur-sm" />
                </>
              )}
            </Carousel>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="px-4 py-2 border-b border-border/50">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  {post.engagement.reactions.map((reaction, index) => (
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
                <span className="ml-2">{post.engagement.likes} likes</span>
              </span>
              <button
                onClick={() => setShowComments(!showComments)}
                className="hover:text-foreground transition-colors"
              >
                {post.engagement.comments} comments
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex gap-6">
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
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-all duration-200 hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Comment</span>
            </button>
          </div>
          <Button
            onClick={handleSave}
            variant={isSaved ? "default" : "outline"}
            size="sm"
            className={`transition-all duration-200 ${
              isSaved
                ? "bg-yellow-400 text-black hover:bg-yellow-300"
                : "hover:bg-yellow-400 hover:text-black hover:border-yellow-400"
            }`}
          >
            <Bookmark
              className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`}
            />
            {isSaved ? "Saved" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

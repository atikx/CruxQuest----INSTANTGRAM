import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";

interface ServerPost {
  id: string;
  userId: string;
  description: string;
  createdAt: string;
  user: {
    username: string;
    name: string | null;
    avatar: string;
  };
  images: {
    imageUrl: string;
  }[];
  tags: {
    tag: {
      name: string;
    };
  }[];
}

interface ExplorePostCardProps {
  post: ServerPost;
}

export default function ExplorePostCard({ post }: ExplorePostCardProps) {
  const navigate = useNavigate();

  const imageUrls = post.images.map((img) => img.imageUrl);
  const tagNames = post.tags.map((t) => t.tag.name);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "now";
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };


  return (
    <Card className="w-full max-w-md mx-auto dark:bg-secondary border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 ring-2 ring-gray-100 dark:ring-gray-800">
              <AvatarImage src={post.user.avatar} alt={post.user.name || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                {post.user.name
                  ? getInitials(post.user.name)
                  : post.user.username}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {post.user.name || post.user.username}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                @{post.user.username} • {formatTimeAgo(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 pb-3">
          <span className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
            {post.description}
          </span>

          {/* Tags */}
          {tagNames.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {tagNames.map((tag, index) => (
                <span key={index} onClick={() => {
                  navigate(`/explore/filter?tag=${tag}`);
                }} className="text-primary cursor-pointer">#{tag}</span>
              ))}
            </span>
          )}
        </div>

        {/* Carousel */}
        {imageUrls.length > 0 && (
          <div className="relative group">
            <Carousel className="w-full">
              <CarouselContent>
                {imageUrls.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={image}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                        onClick={() => navigate(`/post/${post.id}`)}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {imageUrls.length > 1 && (
                <>
                  <CarouselPrevious className="absolute top-1/2 left-3 -translate-y-1/2 h-8 w-8 bg-white/40 hover:bg-white/60 border-0 backdrop-blur-sm" />
                  <CarouselNext className="absolute top-1/2 right-3 -translate-y-1/2 h-8 w-8 bg-white/40 hover:bg-white/60 border-0 backdrop-blur-sm" />
                </>
              )}
            </Carousel>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

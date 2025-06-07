import React, { useState } from "react";
import { MessageCircle, Reply, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosinstance";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store";

interface User {
  id: string;
  username: string;
  name: string | null;
  avatar: string;
}

interface ServerComment {
  id: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  user: User;
}

interface ServerResponse {
  message: string;
  comments: Array<{
    id: string;
    comments: ServerComment[];
  }>;
}

interface NestedComment {
  id: string;
  user: User;
  content: string;
  timestamp: string;
  parent_id?: string | null;
  children?: NestedComment[];
}

interface PostDetailCommentsProps {
  postId: number;
}

// Transform server data to component format
function transformServerComments(serverData: ServerResponse): NestedComment[] {
  const allComments: NestedComment[] = [];

  serverData.comments.forEach((postComments) => {
    postComments.comments.forEach((comment) => {
      allComments.push({
        id: comment.id,
        user: comment.user,
        content: comment.content,
        timestamp: formatTimestamp(comment.createdAt),
        parent_id: comment.parentId,
        children: [],
      });
    });
  });

  return allComments;
}

// Format timestamp to relative time
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
}

// Build comment tree structure
function buildCommentTree(comments: NestedComment[]): NestedComment[] {
  const map = new Map<string, NestedComment>();
  const roots: NestedComment[] = [];

  comments.forEach((comment) => {
    comment.children = comment.children || [];
    map.set(comment.id, comment);
  });

  comments.forEach((comment) => {
    if (comment.parent_id) {
      const parent = map.get(comment.parent_id);
      if (parent) {
        parent.children!.push(comment);
      }
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

// Comment Form Component with Auth Store Integration
const CommentForm = ({
  onSubmit,
  onCancel,
  placeholder = "Add a comment...",
  isReply = false,
  isLoading = false,
}: {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  isReply?: boolean;
  isLoading?: boolean;
}) => {
  const [content, setContent] = useState("");
  const user = useAuthStore((state) => state.user);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;

    onSubmit(content.trim());
    setContent("");
    if (onCancel) onCancel();
  };

  const getInitials = (user: any) => {
    if (!user) return "U";
    const displayName = user.name || user.username || "User";
    return displayName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className={`${isReply ? "ml-8 mt-3" : "mt-4"}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={user?.avatar || ""} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 ml-11">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={!content.trim() || isLoading}>
            <Send className="w-4 h-4 mr-1" />
            {isLoading ? "Posting..." : isReply ? "Reply" : "Comment"}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Individual Comment Component
const CommentCard = ({
  comment,
  depth = 0,
  onReply,
  isReplying = false,
}: {
  comment: NestedComment;
  depth?: number;
  onReply: (parentId: string, content: string) => void;
  isReplying?: boolean;
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const maxDepth = 3;

  const handleReply = (content: string) => {
    onReply(comment.id, content);
    setShowReplyForm(false);
  };

  const getInitials = (user: User) => {
    const displayName = user.name || user.username;
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getDisplayName = (user: User) => {
    return user.name || user.username;
  };

  return (
    <div className={`${depth > 0 ? "ml-8 mt-3" : "mt-4"} relative`}>
      {depth > 0 && (
        <div className="absolute -left-8 top-0 w-px h-full bg-border opacity-30" />
      )}

      <Card
        className={`${
          depth > 0 ? "bg-muted/30" : "bg-background"
        } border-0 shadow-sm py-3`}
      >
        <CardContent className="">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={comment.user.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-xs">
                {getInitials(comment.user)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">
                  {getDisplayName(comment.user)}
                </span>
                <span className="text-xs text-muted-foreground">
                  @{comment.user.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {comment.timestamp}
                </span>
              </div>

              <div className="text-sm text-foreground/90 mb-3">
                {comment.content}
              </div>

              <div className="flex items-center gap-4">
                {depth < maxDepth && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isReplying}
                  >
                    <Reply className="w-3 h-3" />
                    {isReplying ? "Replying..." : "Reply"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showReplyForm && (
        <CommentForm
          onSubmit={handleReply}
          onCancel={() => setShowReplyForm(false)}
          placeholder={`Reply to ${getDisplayName(comment.user)}...`}
          isReply={true}
          isLoading={isReplying}
        />
      )}

      {comment.children && comment.children.length > 0 && depth < maxDepth && (
        <div className="space-y-0">
          {comment.children.map((child) => (
            <CommentCard
              key={child.id}
              comment={child}
              depth={depth + 1}
              onReply={onReply}
              isReplying={isReplying}
            />
          ))}
        </div>
      )}

      {comment.children && comment.children.length > 0 && depth >= maxDepth && (
        <div className="ml-8 mt-3">
          <Button variant="ghost" size="sm" className="text-xs text-primary">
            View {comment.children.length} more{" "}
            {comment.children.length === 1 ? "reply" : "replies"}
          </Button>
        </div>
      )}
    </div>
  );
};

// Main Comments Component
export default function Comments({ postId }: PostDetailCommentsProps) {
  const [showAddComment, setShowAddComment] = useState(false);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Fetch comments using useQuery
  const {
    data: comments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await api.get(`/verifiedUser/getComments/${postId}`);
      return transformServerComments(response.data);
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string | null }) => {
      const response = await api.post(`/verifiedUser/addComment/`, {
        postId,
        content,
        parentId: parentId || null,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      toast.success("Comment added successfully!");
      setShowAddComment(false);
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment. Please try again.");
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId: string }) => {
      const response = await api.post(`/verifiedUser/addComment/`, {
        postId,
        content,
        parentId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      toast.success("Reply added successfully!");
    },
    onError: (error) => {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply. Please try again.");
    },
  });

  const handleAddComment = (content: string) => {
    addCommentMutation.mutate({ content });
  };

  const handleReply = (parentId: string, content: string) => {
    replyMutation.mutate({ content, parentId });
  };

  const nestedComments = buildCommentTree(comments);
  const totalComments = comments.length;

  if (isLoading) {
    return (
      <div className="p-0 relative">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-0 relative">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Failed to load comments
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['comments', postId] })}
              variant="outline"
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Comments</h2>
          <Badge variant="outline" className="text-xs">
            {totalComments}
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddComment(!showAddComment)}
          disabled={addCommentMutation.isPending}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Add Comment
        </Button>
      </div>

      {/* Add Comment Form */}
      {showAddComment && (
        <CommentForm
          onSubmit={handleAddComment}
          onCancel={() => setShowAddComment(false)}
          placeholder="Share your thoughts..."
          isLoading={addCommentMutation.isPending}
        />
      )}

      {/* Comments List */}
      <div className="space-y-0">
        {nestedComments.length > 0 ? (
          nestedComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              isReplying={replyMutation.isPending}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No comments yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to share your thoughts!
            </p>
            <Button 
              onClick={() => setShowAddComment(true)}
              disabled={addCommentMutation.isPending}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Start the conversation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

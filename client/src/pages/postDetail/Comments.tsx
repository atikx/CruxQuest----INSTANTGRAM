import React, { useState } from "react";
import { MessageCircle, Reply, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface User {
  name: string;
  avatar: string;
}

interface NestedComment {
  id: number;
  user: User;
  content: string;
  timestamp: string;
  parent_id?: number | null;
  children?: NestedComment[];
}

interface PostDetailCommentsProps {
  postId: number;
}

// Sample data for demonstration (removed likes and isLiked properties)
const sampleComments: NestedComment[] = [
  {
    id: 1,
    user: {
      name: "John Doe",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    content: "Great post! Thanks for sharing this amazing content. The photos are absolutely stunning!",
    timestamp: "2 hours ago",
    parent_id: null,
    children: [
      {
        id: 2,
        user: {
          name: "Jane Smith",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        },
        content: "I totally agree! The composition is perfect.",
        timestamp: "1 hour ago",
        parent_id: 1,
        children: []
      },
      {
        id: 3,
        user: {
          name: "Mike Johnson",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        },
        content: "Where was this taken? I'd love to visit this place!",
        timestamp: "45 minutes ago",
        parent_id: 1,
        children: []
      }
    ]
  },
  {
    id: 4,
    user: {
      name: "Sarah Wilson",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    },
    content: "This is incredible! The lighting and colors are so vibrant. What camera did you use?",
    timestamp: "3 hours ago",
    parent_id: null,
    children: [
      {
        id: 5,
        user: {
          name: "Alex Brown",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        },
        content: "Looks like it was shot with a professional DSLR. The depth of field is amazing!",
        timestamp: "2 hours ago",
        parent_id: 4,
        children: []
      }
    ]
  },
  {
    id: 6,
    user: {
      name: "Emma Davis",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    },
    content: "Beautiful shot! The way you captured the natural light is phenomenal. Keep up the great work! 📸✨",
    timestamp: "4 hours ago",
    parent_id: null,
    children: []
  }
];

// Build comment tree structure
function buildCommentTree(comments: NestedComment[]): NestedComment[] {
  const map = new Map<number, NestedComment>();
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

// Comment Form Component
const CommentForm = ({
  onSubmit,
  onCancel,
  placeholder = "Add a comment...",
  isReply = false,
}: {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  isReply?: boolean;
}) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmit(content.trim());
    setContent("");
    if (onCancel) onCancel();
  };

  return (
    <div className={`${isReply ? "ml-8 mt-3" : "mt-4"}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
              Y
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 ml-11">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={!content.trim()}>
            <Send className="w-4 h-4 mr-1" />
            {isReply ? "Reply" : "Comment"}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Individual Comment Component (removed onLike prop and like functionality)
const CommentCard = ({
  comment,
  depth = 0,
  onReply,
}: {
  comment: NestedComment;
  depth?: number;
  onReply: (parentId: number, content: string) => void;
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const maxDepth = 3;

  const handleReply = (content: string) => {
    onReply(comment.id, content);
    setShowReplyForm(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className={`${depth > 0 ? "ml-8 mt-3" : "mt-4"} relative`}>
      {depth > 0 && (
        <div className="absolute -left-8 top-0 w-px h-full bg-border opacity-30" />
      )}

      <Card className={`${depth > 0 ? "bg-muted/30" : "bg-background"} border-0 shadow-sm py-3`}>
        <CardContent className="">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={comment.user.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-xs">
                {getInitials(comment.user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
              </div>

              <div className="text-sm text-foreground/90 mb-3">
                {comment.content}
              </div>

              {/* Removed like button, only keeping reply button */}
              <div className="flex items-center gap-4">
                {depth < maxDepth && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Reply className="w-3 h-3" />
                    Reply
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
          placeholder={`Reply to ${comment.user.name}...`}
          isReply={true}
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
            />
          ))}
        </div>
      )}

      {comment.children && comment.children.length > 0 && depth >= maxDepth && (
        <div className="ml-8 mt-3">
          <Button variant="ghost" size="sm" className="text-xs text-primary">
            View {comment.children.length} more {comment.children.length === 1 ? "reply" : "replies"}
          </Button>
        </div>
      )}
    </div>
  );
};

// Main Comments Component (removed like functionality)
export default function Comments({ postId }: PostDetailCommentsProps) {
  const [comments, setComments] = useState<NestedComment[]>(sampleComments);
  const [showAddComment, setShowAddComment] = useState(false);

  const nestedComments = buildCommentTree(comments);
  const totalComments = comments.length;

  const handleAddComment = (content: string) => {
    const newComment: NestedComment = {
      id: Date.now(),
      user: {
        name: "You",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      },
      content,
      timestamp: "Just now",
      parent_id: null,
      children: []
    };

    setComments([...comments, newComment]);
    setShowAddComment(false);
  };

  const handleReply = (parentId: number, content: string) => {
    const newReply: NestedComment = {
      id: Date.now(),
      user: {
        name: "You",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      },
      content,
      timestamp: "Just now",
      parent_id: parentId,
      children: []
    };

    setComments([...comments, newReply]);
  };

  return (
    <div className=" p-0 relative">
      {/* Header */}
      <div className="flex  top-0 z-20 items-center justify-between  pb-4">
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
            />
          ))
        ) : (
          <div className="text-center ">
            <MessageCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No comments yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to share your thoughts!
            </p>
            <Button onClick={() => setShowAddComment(true)}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Start the conversation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

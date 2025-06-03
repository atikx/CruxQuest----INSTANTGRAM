import { PostCard } from "./PostCard";
import postImg from "@/assets/images/postImg.png";

const samplePosts = [
  {
    id: 1,
    user: {
      name: "Sarah Johnson",
      username: "sarah_j",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      isVerified: true,
      isPro: true,
      isOnline: true,
      location: "San Francisco, CA",
    },
    content:
      "Just finished an amazing hiking trip in Yosemite! The views were absolutely breathtaking and the weather was perfect. Can't wait to go back next month!",
    hashtags: ["#hiking", "#yosemite", "#nature", "#adventure"],
    images: [postImg],
    timestamp: "2 hours ago",
    engagement: {
      likes: 142,
      comments: 23,
      shares: 8,
      reactions: [
        { type: "like", emoji: "❤️", color: "bg-red-500" },
        { type: "love", emoji: "😍", color: "bg-pink-500" },
        { type: "wow", emoji: "😮", color: "bg-yellow-500" },
      ],
    },
  },
  {
    id: 2,
    user: {
      name: "Alex Rodriguez",
      username: "alex_dev",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",

      isVerified: false,
      isPro: false,
      isOnline: false,
      location: "Austin, TX",
    },
    content:
      "Working on a new React project today. The component architecture is coming together nicely! Love how clean the code looks with TypeScript.",
    hashtags: ["#coding", "#react", "#typescript", "#webdev"],
    images: [
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
    ],
    timestamp: "4 hours ago",
    engagement: {
      likes: 89,
      comments: 12,
      shares: 5,
      reactions: [
        { type: "like", emoji: "👍", color: "bg-blue-500" },
        { type: "fire", emoji: "🔥", color: "bg-orange-500" },
      ],
    },
  },
  {
    id: 3,
    user: {
      name: "Maya Patel",
      username: "maya_foodie",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      isVerified: true,
      isPro: false,
      isOnline: true,
      location: "Mumbai, India",
    },
    content:
      "Tried making homemade pasta for the first time and it turned out amazing! The secret is definitely in the quality of the ingredients and taking your time with the dough.",
    hashtags: ["#cooking", "#pasta", "#homemade", "#foodie"],
    images: [
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=400&fit=crop",
    ],
    timestamp: "6 hours ago",
    engagement: {
      likes: 256,
      comments: 34,
      shares: 15,
      reactions: [
        { type: "love", emoji: "😍", color: "bg-pink-500" },
        { type: "yum", emoji: "😋", color: "bg-green-500" },
        { type: "fire", emoji: "🔥", color: "bg-orange-500" },
      ],
    },
  },
];

export default function Home() {
  return (
    <div className="flex flex-wrap gap-8 md:gap-4 lg:gap-8 px-8 md:px-4 lg:px-8">
      {samplePosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/auth/Auth";
import Home from "./pages/home/Home";
import Otp from "./pages/otp/Otp";
import NewPost from "./pages/newPost/NewPost";
import UserProtected from "./pages/protected/UserProtected";
import PostDetailPage from "./pages/postDetail/PostDetail";
import postImg from "@/assets/images/postImg.png";

const samplePosts = [
  {
    id: 1,
    user: {
      name: "Sarah Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    },
    content:
      "Just finished an amazing hiking trip in Yosemite! The views were absolutely breathtaking and the weather was perfect. Can't wait to go back next month!",
    hashtags: ["#hiking", "#yosemite", "#nature", "#adventure"],
    images: [postImg],
    timestamp: "2 hours ago",
    engagement: {
      likes: 142,
    },
  },
  {
    id: 2,
    user: {
      name: "Alex Rodriguez",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
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
    },
  },
  {
    id: 3,
    user: {
      name: "Maya Patel",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
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
    },
  },
];

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route element={<UserProtected />}>
        <Route path="/otp" element={<Otp />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/newPost" element={<NewPost />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/post/:id"
          element={<PostDetailPage posts={samplePosts} />}
        />
      </Route>
    </Routes>
  );
}

export default App;

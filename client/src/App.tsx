import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/auth/Auth";
import Home from "./pages/home/Home";
import Otp from "./pages/otp/Otp";
import NewPost from "./pages/newPost/NewPost";
import UserProtected from "./pages/protected/UserProtected";
import PostDetailPage from "./pages/postDetail/PostDetail";
import YourProfile from "./pages/profile/YourProfile";
import Explore from "./pages/explore/Explore";

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route element={<UserProtected />}>
        <Route path="/otp" element={<Otp />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/newPost" element={<NewPost />} />
        <Route path="/home" element={<Home />} />

        {/* Explore route with and without search param */}
        <Route path="/explore" element={<Explore />} />
        <Route path="/explore/:search" element={<Explore />} />

        <Route path="/yourProfile" element={<YourProfile />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;

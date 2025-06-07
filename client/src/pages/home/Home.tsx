import { PostCard } from "./PostCard";
import api from "@/lib/axiosinstance";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ClipLoader } from "react-spinners";



export default function Home() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // Email verification mutation
  const emailVerificationMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get("/user/sendOtp");
      return res.data;
    },
    onSuccess: (data) => {
      console.log(data);
      toast.success("Verification email sent successfully!", {
        description: "Please check your inbox and spam folder.",
      });
      navigate("/otp");
    },
    onError: (error) => {
      console.error("Error resending verification email:", error);
      toast.error("Failed to resend verification email.", {
        description: "Please try again later.",
      });
    },
  });

  // Friend posts query
  const {
    data: friendPosts = [],
    isLoading: isLoadingPosts,
    error: postsError,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ["friendPosts"],
    queryFn: async () => {
      const res = await api.get("/verifiedUser/getFriendPosts");
      return res.data.posts;
    },
    enabled: !!user?.isEmailVerified,
    refetchOnWindowFocus: false,
  });

  const handleEmailVerification = () => {
    emailVerificationMutation.mutate();
  };

  // Handle posts error
  if (postsError && user?.isEmailVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-auto shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            Failed to Load Posts
          </h3>
          <p className="text-muted-foreground mb-4">
            We couldn't load your friend's posts. Please try again.
          </p>
          <button
            onClick={() => refetchPosts()}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Email verification required
  if (!user?.isEmailVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-auto shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-full mx-auto mb-4">
            <svg
              className="w-6 h-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            Email Verification Required
          </h3>
          <p className="text-muted-foreground mb-4">
            Please verify your email address to access this feature and continue
            using our platform.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleEmailVerification}
              disabled={emailVerificationMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {emailVerificationMutation.isPending ? (
                <>
                  <ClipLoader
                    color="#ffffff"
                    loading={true}
                    size={16}
                    aria-label="Loading Spinner"
                  />
                  Sending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </button>
            <p className="text-sm text-muted-foreground">
              Check your inbox and spam folder for the verification link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading posts
  if (isLoadingPosts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <ClipLoader
          color="#3498db"
          loading={true}
          size={50}
          aria-label="Loading Posts"
        />
        <p className="mt-4 text-muted-foreground">Loading your feed...</p>
      </div>
    );
  }

  // No posts available
  if (friendPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-auto shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-full mx-auto mb-4">
            <svg
              className="w-6 h-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            No Posts Yet
          </h3>
          <p className="text-muted-foreground">
            Your friends haven't shared anything yet. Check back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-8 md:gap-4 lg:gap-8 px-8 md:px-4 lg:px-8">
      {friendPosts.map((post : any) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

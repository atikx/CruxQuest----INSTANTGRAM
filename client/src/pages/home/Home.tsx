import { PostCard } from "./PostCard";
import postImg from "@/assets/images/postImg.png";
import api from "@/lib/axiosinstance";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const emailVerificationMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get("/user/sendOtp");
      return res.data;
    },
  });

  const handleEmailVerification = async () => {
    try {
      const data = await emailVerificationMutation.mutateAsync();
      console.log(data);
      toast.success("Verification email sent successfully!", {
        description: "Please check your inbox and spam folder.",
      });
      navigate("/otp");
    } catch (error) {
      console.error("Error resending verification email:", error);
      toast.error("Failed to resend verification email.", {
        description: "Please try again later.",
      });
    }
  };

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
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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

  return (
    <div className="flex flex-wrap gap-8 md:gap-4 lg:gap-8 px-8 md:px-4 lg:px-8">
      {samplePosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

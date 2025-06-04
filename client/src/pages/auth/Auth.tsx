// src/pages/LoginPage.jsx

import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import api from "@/lib/axiosinstance";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import authImg from "@/assets/images/authImg.png";
import { TrainFrontTunnel } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();
  useEffect(() => {
    AOS.init({
      duration: 400,
      once: true,
      easing: "ease-out-cubic",
    });
  }, []);

  // Controlled state for Login form
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  // Controlled state for Sign Up form
  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  // Handle changes for Login form
  const handleLoginChange = (e: any) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle changes for Sign Up form
  const handleSignupChange = (e: any) => {
    const { name, value } = e.target;
    setSignupForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle Login form submission
  const handleLoginSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await api.post("/user/auth/login", {
        username: loginForm.username.trim(),
        password: loginForm.password.trim(),
      });
      if (res.status === 200) {
        toast.success(res.data.message);
        setUser(res.data.user); // Set user in the store
        navigate("/"); // Redirect to home page after successful login
      }
    } catch (error: any) {
      console.error("Error during login:", error);
      toast.error("Login failed", {
        description: error.response?.data || "An error occurred",
      });
      return;
    }
  };

  // Handle Sign Up form submission
  const handleSignupSubmit = async (e: any) => {
    e.preventDefault();
    try {
      console.log(signupForm);
      const res = await api.post("/user/auth/signup", {
        username: signupForm.username.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password.trim(),
      });
      if (res.status === 200) {
        toast.success("Sign Up successful", {
          description: "Please enter the OTP sent on your email for verification.",
        });
        setUser(res.data.user); // Set user in the store
        navigate("/otp"); // Redirect to home page after successful signup
      }
    } catch (error: any) {
      console.error("Error during signup:", error);
      toast.error("Sign Up failed", {
        description: error.response?.data || "An error occurred",
      });
      return;
    }
  };

  const handleGoogleButton = async () => {
    toast.success("Hello from google side", {
      description: "this is test toast",
    });
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div
            className="flex items-center gap-3 text-3xl font-medium"
            data-aos="fade-right"
          >
            <div className="flex items-center justify-center rounded-md text-primary">
              <TrainFrontTunnel className="size-10" />
            </div>
            InstantGram
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Tabs defaultValue="login" className="w-full">
              <TabsList
                className="grid w-full grid-cols-2 mb-6"
                data-aos="fade-down"
              >
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              {/* Login Tab */}
              <TabsContent value="login">
                <form
                  data-aos="fade-up"
                  className={cn("flex flex-col gap-6")}
                  onSubmit={handleLoginSubmit}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 data-aos="zoom-in" className="text-2xl font-bold">
                      Welcome Back!
                    </h1>
                    <p className="text-balance text-sm text-muted-foreground">
                      Enter your credentials to log in
                    </p>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="login-email">Username</Label>
                      <Input
                        id="login-email"
                        name="username"
                        type="text"
                        placeholder="eg: atikx!!"
                        required
                        value={loginForm.email}
                        onChange={handleLoginChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        name="password"
                        placeholder="*******"
                        type="password"
                        required
                        value={loginForm.password}
                        onChange={handleLoginChange}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      data-aos="fade-up"
                      data-aos-delay="100"
                    >
                      Sign In
                    </Button>
                  </div>
                </form>
                <div className="relative text-center mt-4 mb-4 text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                  <span className="relative z-10 bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleButton}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="mr-2 h-5 w-5"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </TabsContent>
              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <form
                  data-aos="fade-up"
                  className={cn("flex flex-col gap-6")}
                  onSubmit={handleSignupSubmit}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 data-aos="zoom-in" className="text-2xl font-bold">
                      Create Account
                    </h1>
                    <p className="text-balance text-sm text-muted-foreground">
                      Enter your details to sign up
                    </p>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="signup-username">Username</Label>
                      <Input
                        id="signup-username"
                        name="username"
                        type="text"
                        placeholder="eg: atikx!!"
                        required
                        value={signupForm.username}
                        onChange={handleSignupChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        value={signupForm.email}
                        onChange={handleSignupChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        placeholder="*******"
                        type="password"
                        required
                        value={signupForm.password}
                        onChange={handleSignupChange}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      data-aos="fade-up"
                      data-aos-delay="100"
                    >
                      Sign Up
                    </Button>
                  </div>
                </form>
                <div
                  className="relative text-center mt-4 mb-4 text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
                  data-aos="fade-up"
                  data-aos-delay="200"
                >
                  <span className="relative z-10 bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleButton}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="mr-2 h-5 w-5"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Sign Up with Google
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src={authImg}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
          data-aos="fade-left"
          data-aos-duration="1200"
        />
      </div>
    </div>
  );
}

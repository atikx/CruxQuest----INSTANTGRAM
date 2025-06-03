// src/pages/LoginPage.jsx

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import authImg from "@/assets/images/authImg.png";
import { TrainFrontTunnel } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  useEffect(() => {
    AOS.init({
      duration: 400,
      once: true,
      easing: "ease-out-cubic",
    });
  }, []);

  const handleGoogleButton = async () => {
    toast.success("Hello from google side", {
      description: "this is test toast",
    });
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a
            href="#"
            className="flex items-center gap-3 text-3xl font-medium"
            data-aos="fade-right"
          >
            <div className="flex items-center justify-center rounded-md text-primary">
              <TrainFrontTunnel className="size-10" />
            </div>
            InstantGram
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6" data-aos="fade-down">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              {/* Login Tab */}
              <TabsContent value="login">
                <form data-aos="fade-up" className={cn("flex flex-col gap-6")}>
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
                        type="email"
                        placeholder="eg: atikx!!"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        placeholder="*******"
                        type="password"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" data-aos="fade-up" data-aos-delay="100">
                      Sign In
                    </Button>
                  </div>
                </form>
                <div
                  className="relative text-center mt-4 mb-4 text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
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
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-5 w-5">
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
                <form data-aos="fade-up" className={cn("flex flex-col gap-6")}>
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
                        type="text"
                        placeholder="eg: atikx!!"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        placeholder="*******"
                        type="password"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <Input
                        id="signup-confirm-password"
                        placeholder="*******"
                        type="password"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" data-aos="fade-up" data-aos-delay="100">
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
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-5 w-5">
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

import {
  Home,
  User,
  Settings,
  TrainFrontTunnel,
  Search,
  Compass,
  Menu,
  CirclePlus,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

import { useAuthStore } from "@/lib/store";

export default function AppNavbar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [searchQuery, setSearchQuery] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const handleSearch = () => {
    console.log("Search for:", searchQuery);
    // Add navigation or API call here
  };

  const navItems = [
    { path: "/home", icon: Home, label: "Home" },
    { path: "/explore", icon: Compass, label: "Explore" },
    ...(user?.isEmailVerified
      ? [
          { path: "/newPost", icon: CirclePlus, label: "New Post" },
          { path: "/yourProfile", icon: User, label: "Profile" },
        ]
      : []),
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const closeSheet = () => {
    setIsSheetOpen(false);
  };

  if (currentPath === "/auth" || currentPath === "/otp") {
    return null; // Hide navbar on auth page
  }

  return (
    <TooltipProvider>
      <div className="flex py-6 items-center px-4 sm:px-6 bg-background  relative">
        {/* Logo + Search - Left side */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center text-foreground font-semibold text-lg">
            <TrainFrontTunnel className="w-5 h-5 sm:w-10 sm:h-10 mr-1 sm:mr-2 text-primary" />
          </div>

          {/* Search - Hidden on mobile, visible on sm+ */}
          <div className="hidden sm:flex items-center space-x-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="#Explore"
              className="h-8 lg:h-12 w-24 lg:w-54 placeholder:text-lg text-sm bg-background border-input"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={handleSearch}
              className="h-8 w-8 lg:h-12 lg:w-12 border-input hover:bg-accent hover:text-accent-foreground"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Centered Navigation Icons with Tooltips - Hidden on mobile */}
        <div className="hidden md:absolute md:left-1/2 md:transform md:-translate-x-1/2 md:flex items-center space-x-4 lg:space-x-6">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = currentPath === path;
            return (
              <Tooltip key={path}>
                <TooltipTrigger asChild>
                  <Link to={path} className="relative">
                    <Icon
                      strokeWidth={2}
                      className={cn(
                        "w-7 h-7 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    />
                    {isActive && (
                      <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Right side - Mobile menu button + Avatar */}
        <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
          {/* Avatar */}
          <div className="flex gap-4 items-center">
            <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
              <AvatarImage
                src={
                  user?.avatar ||
                  "https://avatars.githubusercontent.com/u/100670938?s=https://img.freepik.com/premium-photo/anime-male-avatar_950633-956.jpg&u=bec078ea0257560ee91f1992ffc1b2125b83b6dd&v=4"
                }
                alt="profile"
              />
            </Avatar>
            <h1 className="text-xl font-semibold text-foreground">
              {user?.name?.split(" ")[0] ||
                user?.username?.split(" ")[0] ||
                "Guest"}
            </h1>
          </div>
          {/* Mobile Sheet Menu - visible only on mobile/tablet */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 md:hidden hover:bg-accent hover:text-accent-foreground"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[400px] bg-background border-border"
            >
              <SheetHeader>
                <SheetTitle className="text-foreground">Navigation</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {/* Mobile Search */}
                <div className="flex items-center space-x-2 sm:hidden">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="#Explore"
                    className="h-9 flex-1 text-sm bg-background border-input"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleSearch}
                    className="h-9 w-9 border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {/* Mobile Navigation Links */}
                <div className="space-y-2 pt-4">
                  {navItems.map(({ path, icon: Icon, label }) => {
                    const isActive = currentPath === path;
                    return (
                      <Link
                        key={path}
                        to={path}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg transition-colors w-full",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={closeSheet}
                      >
                        <Icon
                          strokeWidth={isActive ? 3 : 2}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </TooltipProvider>
  );
}

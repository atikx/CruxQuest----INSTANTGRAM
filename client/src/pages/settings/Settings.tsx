import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  LogOut,
  Moon,
  Sun,
  Monitor,
  Users,
  Search,
  UserMinus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/axiosinstance";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";

interface Friend {
  id: string;
  username: string;
  name: string | null;
  avatar: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface FriendsResponse {
  message: string;
  friends: Friend[];
  pagination: PaginationInfo;
}

interface SearchResponse {
  message: string;
  searchResults: Friend[];
  pagination: PaginationInfo;
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchPage, setSearchPage] = useState<number>(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch friends using useQuery with pagination
  const {
    data: friendsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['friends', currentPage],
    queryFn: async (): Promise<FriendsResponse> => {
      const res = await api.get(`/verifiedUser/getFriends?page=${currentPage}&limit=10`);
      return res.data;
    },
    enabled: user?.isEmailVerified && !isSearchMode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const friends = friendsData?.friends || [];
  const friendsPagination = friendsData?.pagination;

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/user/auth/logout");
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Logged out successfully!");
      navigate("/auth");
    },
    onError: (error) => {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    },
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const res = await api.put("/verifiedUser/removeFriend", { friendId });
      return res.data;
    },
    onMutate: async (friendId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['friends'] });
      
      // Update filtered friends immediately
      setFilteredFriends(prev => prev.filter(friend => friend.id !== friendId));
      
      return { friendId };
    },
    onSuccess: () => {
      toast.success("Friend removed successfully!");
    },
    onError: (error, friendId, context) => {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend.");
    },
    onSettled: () => {
      // Always refetch after mutation completes
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  // Search friends mutation with pagination
  const searchFriendsMutation = useMutation({
    mutationFn: async ({ query, page = 1 }: { query: string; page?: number }) => {
      const res = await api.get(`/verifiedUser/searchFriends/${query.trim()}?page=${page}&limit=10`);
      return res.data as SearchResponse;
    },
    onSuccess: (data) => {
      const searchResults: Friend[] = data.searchResults || [];
      setFilteredFriends(searchResults);
      setPaginationInfo(data.pagination);
      setIsSearchMode(true);
      
      if (searchResults.length === 0 && data.pagination.currentPage === 1) {
        toast.info("No friends found matching your search.");
      }
    },
    onError: (error: any) => {
      console.error("Error during search:", error);
      if (error.response?.status === 404) {
        setFilteredFriends([]);
        setPaginationInfo(null);
        setIsSearchMode(true);
        toast.info("No friends found matching your search.");
      } else {
        toast.error("Failed to search friends. Please try again.");
      }
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "light":
        return <Sun className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const handleRemoveFriend = (friendId: string) => {
    removeFriendMutation.mutate(friendId);
  };

  const handleSearchClick = (page: number = 1) => {
    if (searchQuery.trim()) {
      setSearchPage(page);
      searchFriendsMutation.mutate({ query: searchQuery, page });
    }
  };

  const handlePageChange = (page: number) => {
    if (isSearchMode && searchQuery.trim()) {
      handleSearchClick(page);
    } else {
      setCurrentPage(page);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchClick(1);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchMode(false);
    setPaginationInfo(null);
    setSearchPage(1);
    // Instead of clearing filteredFriends, restore the current friends data
    setFilteredFriends(friends);
  };

  const getDisplayName = (friend: Friend): string => {
    return friend.name || friend.username || "Unknown User";
  };

  const getInitials = (friend: Friend): string => {
    const name = getDisplayName(friend);
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Update filtered friends when friends data changes (non-search mode)
  useEffect(() => {
    if (!isSearchMode && friends.length >= 0) {
      setFilteredFriends(friends);
      setPaginationInfo(friendsPagination || null);
    }
  }, [friends, friendsPagination, isSearchMode]);

  // Reset search mode when search query is cleared
  useEffect(() => {
    if (!searchQuery) {
      clearSearch();
    }
  }, [searchQuery]);

  // Get current pagination info
  const currentPaginationInfo = isSearchMode ? paginationInfo : friendsPagination;

  // Render pagination component
  const renderPagination = () => {
    if (!currentPaginationInfo || currentPaginationInfo.totalPages <= 1) return null;

    const { currentPage, totalPages, hasPreviousPage, hasNextPage } = currentPaginationInfo;

    return (
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredFriends.length} of {currentPaginationInfo.totalCount} friends
        </p>
        
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => hasPreviousPage && handlePageChange(currentPage - 1)}
                className={!hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {/* Show first page */}
            {currentPage > 2 && (
              <>
                <PaginationItem>
                  <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">
                    1
                  </PaginationLink>
                </PaginationItem>
                {currentPage > 3 && <PaginationEllipsis />}
              </>
            )}
            
            {/* Show previous page */}
            {hasPreviousPage && (
              <PaginationItem>
                <PaginationLink 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  className="cursor-pointer"
                >
                  {currentPage - 1}
                </PaginationLink>
              </PaginationItem>
            )}
            
            {/* Current page */}
            <PaginationItem>
              <PaginationLink isActive>
                {currentPage}
              </PaginationLink>
            </PaginationItem>
            
            {/* Show next page */}
            {hasNextPage && (
              <PaginationItem>
                <PaginationLink 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  className="cursor-pointer"
                >
                  {currentPage + 1}
                </PaginationLink>
              </PaginationItem>
            )}
            
            {/* Show last page */}
            {currentPage < totalPages - 1 && (
              <>
                {currentPage < totalPages - 2 && <PaginationEllipsis />}
                <PaginationItem>
                  <PaginationLink 
                    onClick={() => handlePageChange(totalPages)} 
                    className="cursor-pointer"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => hasNextPage && handlePageChange(currentPage + 1)}
                className={!hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>

        {/* Logout Confirmation Dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="default" 
              className="flex items-center gap-2"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to logout?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You will be signed out of your account and redirected to the
                login page. Any unsaved changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                Yes, Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getThemeIcon()}
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the application looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-select" className="text-sm font-medium">
                Theme
              </Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Friends Management */}
        {user?.isEmailVerified && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Friends Management
                </div>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  {currentPaginationInfo ? currentPaginationInfo.totalCount : 0}
                </Badge>
              </CardTitle>
              <CardDescription>
                Manage your friends list and connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Friends */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search friends by name or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                    autoComplete="off"
                    disabled={searchFriendsMutation.isPending}
                  />
                </div>
                <Button
                  onClick={() => handleSearchClick(1)}
                  variant="outline"
                  size="default"
                  className="px-4"
                  disabled={searchFriendsMutation.isPending || !searchQuery.trim()}
                >
                  <Search className="w-4 h-4 mr-2" />
                  {searchFriendsMutation.isPending ? "Searching..." : "Search"}
                </Button>
                {isSearchMode && (
                  <Button
                    onClick={clearSearch}
                    variant="ghost"
                    size="default"
                    className="px-4"
                  >
                    Clear
                  </Button>
                )}
              </div>

              <Separator />

              {/* Friends List */}
              {isLoading && !isSearchMode ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading friends...
                  </p>
                </div>
              ) : error && !isSearchMode ? (
                <div className="text-center py-8 text-red-500">
                  <p className="text-sm">Failed to load friends list</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['friends'] })}
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery || isSearchMode ? (
                    <p className="text-sm">
                      No friends found matching your search
                    </p>
                  ) : (
                    <>
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No friends yet</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage
                                src={friend.avatar}
                                alt={getDisplayName(friend)}
                              />
                              <AvatarFallback>
                                {getInitials(friend)}
                              </AvatarFallback>
                            </Avatar>
                            {friend.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">
                              {getDisplayName(friend)}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              @{friend.username}
                            </p>
                            {friend.lastSeen && !friend.isOnline && (
                              <p className="text-xs text-muted-foreground">
                                Last seen:{" "}
                                {new Date(friend.lastSeen).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFriend(friend.id)}
                            className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={removeFriendMutation.isPending}
                          >
                            <UserMinus className="w-3 h-3 mr-1" />
                            {removeFriendMutation.isPending ? "Removing..." : "Remove"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {renderPagination()}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

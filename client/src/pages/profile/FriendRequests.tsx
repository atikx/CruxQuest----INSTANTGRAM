import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Check, X, UserPlus, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axiosinstance";

interface FriendRequest {
  id: string;
  fromUser: {
    id: string;
    username: string;
    name: string;
    avatar: string;
  };
  toUser: string;
  status: string;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  name: string | null;
  avatar: string;
  status: "pending" | "accepted" | "rejected" | "not_sent";
}

interface SearchResponse {
  message: string;
  searchResults: User[];
}

interface FriendRequestsResponse {
  message: string;
  requests: FriendRequest[];
}

const FriendRequests: React.FC = () => {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleAcceptRequest = async (requestId: string): Promise<void> => {
    try {
      const res = await api.put("/verifiedUser/acceptFriendRequest", {
        requestId,
      });

      if (res.status === 200) {
        setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
        toast.success(res.data.message || "Friend request accepted!");
      }
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request.", {
        description: error.response?.data?.message || "Please try again later.",
      });
    }
  };

  const handleDeclineRequest = async (requestId: string): Promise<void> => {
    try {
      const res = await api.put("/verifiedUser/declineFriendRequest", {
        requestId,
      });

      if (res.status === 200) {
        setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
        toast.success("Friend request declined!");
      }
    } catch (error: any) {
      console.error("Error declining friend request:", error);
      toast.error("Failed to decline friend request.", {
        description: error.response?.data?.message || "Please try again later.",
      });
    }
  };

  const handleSearch = async (): Promise<void> => {
    setHasSearched(true);

    if (searchQuery.trim().length > 0) {
      setIsSearching(true);

      try {
        const res = await api.get(
          `/verifiedUser/searchUser/?query=${searchQuery.trim()}`
        );

        if (
          res.data &&
          res.data.searchResults &&
          Array.isArray(res.data.searchResults)
        ) {
          setSearchResults(res.data.searchResults);
        } else {
          setSearchResults([]);
        }

        setIsSearching(false);
      } catch (error: any) {
        console.error("Error during search:", error);
        toast.error(error.response?.data?.message);
        setSearchResults([]);
        setIsSearching(false);
      }
    } else {
      console.log("Empty search query - clearing results");
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);

    if (hasSearched) {
      setHasSearched(false);
      setSearchResults([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      console.log("Enter key pressed, triggering search");
      handleSearch();
    }
  };

  const getFriendRequests = async () => {
    try {
      const res = await api.get("/verifiedUser/getFriendRequests");

      if (res.status === 200) {
        // Handle the new API response structure
        const requestsData: FriendRequestsResponse = res.data;
        setFriendRequests(requestsData.requests || []);
      } else {
        console.error("Failed to fetch friend requests:", res.data);
        toast.error("Failed to fetch friend requests. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      toast.error("Failed to fetch friend requests. Please try again later.");
    }
  };

  useEffect(() => {
    getFriendRequests();
  }, []);

  const handleSendFriendRequest = async (userId: string): Promise<void> => {
    console.log(`Sending friend request to user ID: ${userId}`);

    try {
      const res = await api.post("/verifiedUser/sendFriendRequest", {
        toUserId: userId,
      });
      if (res.status == 200) {
        setSearchResults((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, status: "pending" as const } : user
          )
        );
        toast.success(res.data.message || "Friend request sent successfully!");
      }
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request.", {
        description: error.response?.data?.message || "Please try again later.",
      });

      setSearchResults((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: "not_sent" as const } : user
        )
      );
    }
  };

  const handleRemoveFriend = async (userId: string): Promise<void> => {
    console.log(`Removing friend with user ID: ${userId}`);
    try {
      const res = await api.put("/verifiedUser/removeFriend", {
        friendId: userId,
      });
      if (res.status === 200) {
        setSearchResults((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, status: "not_sent" as const } : user
          )
        );
        toast.success(res.data.message || "Friend removed successfully!");
      }
    } catch (error: any) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend.", {
        description: error.response?.data?.message || "Please try again later.",
      });
    }
  };

  // Helper function to get display name
  const getname = (user: User): string => {
    return user.name || user.username || "Unknown User";
  };

  // Helper function to get initials for avatar fallback
  const getInitials = (user: User): string => {
    const name = getname(user);
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Helper function to render friend request button based on status
  const renderFriendRequestButton = (user: User) => {
    switch (user.status) {
      case "pending":
        return (
          <Button
            size="sm"
            disabled
            className="bg-green-600 hover:bg-green-700 text-white px-4"
          >
            <Check className="w-4 h-4 mr-1" />
            Sent
          </Button>
        );

      case "accepted":
        return (
          <Button
            size="sm"
            onClick={() => handleRemoveFriend(user.id)}
            variant="destructive"
            className="px-4"
          >
            <X className="w-4 h-4 mr-1" />
            Remove Friend
          </Button>
        );

      case "rejected":
        return (
          <Button
            size="sm"
            disabled
            variant="outline"
            className="px-4 text-red-600 border-red-300"
          >
            <X className="w-4 h-4 mr-1" />
            Rejected
          </Button>
        );

      case "not_sent":
      default:
        return (
          <Button
            size="sm"
            onClick={() => handleSendFriendRequest(user.id)}
            className="px-4"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Add Friend
          </Button>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Send Friend Request Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5" />
          <h2 className="text-lg font-semibold">
            Send Friend Request / Remove Friends
          </h2>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for friends by name or username..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="pl-10"
              autoComplete="off"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-6"
          >
            {isSearching ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {isSearching && (
          <div className="text-center py-4 text-muted-foreground">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-sm">Searching...</p>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar} alt={getname(user)} />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{getname(user)}</h4>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </div>
                {renderFriendRequestButton(user)}
              </div>
            ))}
          </div>
        )}

        {hasSearched &&
          searchQuery &&
          !isSearching &&
          searchResults.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No users found matching "{searchQuery}"</p>
            </div>
          )}
      </Card>

      {/* Friend Requests Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Friend Requests</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {friendRequests.length}
          </Badge>
        </div>
      </div>

      {friendRequests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">
            No pending friend requests
          </h3>
          <p className="text-sm">
            When someone sends you a friend request, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {friendRequests.map((request) => (
            <Card
              key={request.id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage
                      src={request.fromUser.avatar}
                      alt={request.fromUser.name}
                    />
                    <AvatarFallback className="text-lg">
                      {request?.fromUser?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">
                        {request.fromUser.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      @{request.fromUser.username}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        Status: {request.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(request.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineRequest(request.id)}
                    className="px-4"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendRequests;

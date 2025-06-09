import React, { useState, useRef, useCallback, useEffect } from "react";
import ExplorePostCard from "./ExplorePostCard";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axiosinstance";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ClipLoader } from "react-spinners";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search, ChevronLeft, ChevronRight } from "lucide-react";

// API Types
interface Post {
  id: string;
  // Add other fields if needed
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
}

interface PostsResponse {
  posts: Post[];
  pagination: PaginationData;
}

// Fetch posts with dynamic route & params
const fetchPostsToExplore = async ({
  sort = "New",
  timeFilter = "All Time",
  tags = [],
  page = 1,
  tagParam = null,
}: {
  sort?: string;
  timeFilter?: string;
  tags?: string[];
  page?: number;
  tagParam?: string | null;
}): Promise<PostsResponse> => {
  const endpoint = tagParam
    ? `/user/getPostsByTag/${encodeURIComponent(tagParam)}`
    : `/user/getPostsToExplore`;

  const response = await api.get(endpoint, {
    params: {
      sort,
      timeFilter,
      tags: tags.join(","), // for /getPostsToExplore only
      page,
      limit: 9,
    },
  });

  return response.data;
};

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <div className="flex gap-1">
        {getPageNumbers().map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className="min-w-[40px]"
          >
            {pageNum}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function Explore() {
  const [sort, setSort] = useState<string>("New");
  const [timeFilter, setTimeFilter] = useState<string>("All Time");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { search } = useParams<{ search?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const queries: Record<string, string> = {};
  queryParams.forEach((value, key) => {
    queries[key] = value;
  });

  const getSearchedPost = async () => {
    try {
      const res = await api.get(`/user/getSearchedPosts/${search}`, {});
      console.log(res.data);
    } catch (error) {
      console.error("Error fetching searched posts:", error);
      return [];
    }
  };

  useEffect(() => {
    const urlTags = queryParams.getAll("tag");
    if (urlTags.length > 0) {
      setSelectedTags(urlTags);
    }
  }, [location.search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [sort, timeFilter, selectedTags, queries.tag]);

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "explorePost",
      sort,
      timeFilter,
      selectedTags,
      queries.tag,
      currentPage,
    ],
    queryFn: () =>
      fetchPostsToExplore({
        sort,
        timeFilter,
        tags: queries.tag ? [] : selectedTags,
        page: currentPage,
        tagParam: queries.tag ?? null,
      }),
    refetchOnWindowFocus: false,
  });

  const posts: Post[] = data?.posts || [];
  const pagination = data?.pagination;

  const sortOptions = ["New", "Top", "Hot", "Controversial"];
  const timeFilterOptions = [
    "All Time",
    "Last 24 Hours",
    "Last Week",
    "Last Month",
    "Last Year",
  ];

  const handleSortChange = (value: string) => setSort(value);
  const handleTimeFilterChange = (value: string) => setTimeFilter(value);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      setTagInput("");
      const tagParams = newTags
        .map((t) => `tag=${encodeURIComponent(t)}`)
        .join("&");
      navigate(`/explore/filter?${tagParams}`);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter((tag) => tag !== tagToRemove);
    setSelectedTags(newTags);

    if (newTags.length > 0) {
      const tagParams = newTags
        .map((t) => `tag=${encodeURIComponent(t)}`)
        .join("&");
      navigate(`/explore/filter?${tagParams}`);
    } else {
      navigate("/explore");
    }
  };

  const clearAllFilters = () => {
    setSort("New");
    setTimeFilter("All Time");
    setSelectedTags([]);
    setCurrentPage(1);
    navigate("/explore");
  };

  const getSectionTitle = () => {
    if (queries.tag) return `Posts tagged with #${queries.tag}`;
    if (selectedTags.length > 0) return `Posts filtered by tags`;
    return `${sort} Posts`;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            <b className="text-primary">|</b> {getSectionTitle()}
          </h1>

          <div className="flex gap-4">
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[140px]">{sort}</SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
              <SelectTrigger className="w-[160px]">{timeFilter}</SelectTrigger>
              <SelectContent>
                {timeFilterOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex gap-2 max-w-md">
            <Input
              placeholder="Add tag to filter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTag(tagInput)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active filters:
              </span>
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  onClick={() => removeTag(tag)}
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer"
                >
                  #{tag}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}

          {(sort !== "New" ||
            timeFilter !== "All Time" ||
            selectedTags.length > 0) && (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          )}
        </div>

        {/* Page Info */}
        {pagination && posts.length > 0 && (
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <ClipLoader color="#4F46E5" size={40} />
          </div>
        )}

        {isError && (
          <p className="text-center text-red-500 text-lg">
            Something went wrong while fetching posts.
          </p>
        )}

        {!isLoading && posts.length === 0 && (
          <p className="text-center text-gray-400 text-lg">
            No posts available.
          </p>
        )}

        {!isLoading && posts.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: Post) => (
                <div key={post.id}>
                  <ExplorePostCard
                    post={post}
                    onLike={() => console.log("Like", post.id)}
                    onBookmark={() => console.log("Bookmark", post.id)}
                    onShare={() => console.log("Share", post.id)}
                  />
                </div>
              ))}
            </div>

            {pagination && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
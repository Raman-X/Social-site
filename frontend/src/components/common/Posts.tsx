import { useEffect } from "react";
import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";
import type { PostType } from "./Post";

// ---------- Props ----------
interface PostsProps {
  feedType: "forYou" | "following" | "posts" | "likes";
  username?: string;
  userId?: string;
}

// ---------- Component ----------
const Posts: React.FC<PostsProps> = ({ feedType, username, userId }) => {
  const getPostEndpoint = () => {
    switch (feedType) {
      case "forYou":
        return "/api/posts/all";
      case "following":
        return "/api/posts/following";
      case "posts":
        return username ? `/api/posts/user/${username}` : "/api/posts/all";
      case "likes":
        return userId ? `/api/posts/likes/${userId}` : "/api/posts/all";
      default:
        return "/api/posts/all";
    }
  };

  const POST_ENDPOINT = getPostEndpoint();

  const {
    data: posts,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<PostType[]>({
    queryKey: ["posts", feedType, username, userId],
    queryFn: async () => {
      const res = await fetch(POST_ENDPOINT);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data as PostType[];
    },
  });

  useEffect(() => {
    refetch();
  }, [feedType, refetch, username, userId]);

  return (
    <>
      {(isLoading || isRefetching) && (
        <div className="flex flex-col justify-center">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {!isLoading && !isRefetching && posts?.length === 0 && (
        <p className="text-center my-4">No posts in this tab. Switch 👻</p>
      )}

      {!isLoading && !isRefetching && posts && (
        <div>
          {posts.map((post) => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      )}
    </>
  );
};

export default Posts;

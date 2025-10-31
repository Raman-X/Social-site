import { FaRegComment, FaRegHeart, FaTrash } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegBookmark } from "react-icons/fa6";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

// ---------- Types ----------
interface User {
  _id: string;
  username: string;
  fullName: string;
  profileImg?: string;
}

interface Comment {
  _id: string;
  text: string;
  user: User;
}

export interface PostType {
  _id: string;
  text: string;
  img?: string;
  user: User;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

interface PostProps {
  post: PostType;
}

// ---------- Component ----------
const Post: React.FC<PostProps> = ({ post }) => {
  const [comment, setComment] = useState<string>("");

  const { data: authUser } = useQuery<User | null>({
    queryKey: ["authUser"],
    queryFn: async (): Promise<User | null> => {
      const res = await fetch("http://localhost:8000/api/auth/me", {
        credentials: "include",
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      return data;
    },
  });
  const queryClient = useQueryClient();

  if (!authUser) return null; // prevent rendering before user data loads

  const postOwner = post.user;
  const isLiked = post.likes.includes(authUser._id);
  const isMyPost = authUser._id === post.user._id;
  const formattedDate = formatPostDate(post.createdAt);

  // ---------- Delete Post ----------
  const { mutate: deletePost, isPending: isDeleting } = useMutation<
    unknown,
    Error,
    void
  >({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // ---------- Like Post ----------
  const { mutate: likePost, isPending: isLiking } = useMutation<
    string[],
    Error,
    void
  >({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/like/${post._id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data as string[];
    },
    onSuccess: (updatedLikes) => {
      // Optimistically update cache
      queryClient.setQueryData<PostType[]>(["posts"], (oldData) =>
        oldData
          ? oldData.map((p) =>
              p._id === post._id ? { ...p, likes: updatedLikes } : p
            )
          : []
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // ---------- Comment Post ----------
  const { mutate: commentPost, isPending: isCommenting } = useMutation<
    unknown,
    Error,
    void
  >({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/comment/${post._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    onSuccess: () => {
      toast.success("Comment posted successfully");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // ---------- Handlers ----------
  const handleDeletePost = () => deletePost();
  const handleLikePost = () => !isLiking && likePost();
  const handlePostComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isCommenting) return;
    commentPost();
  };

  // ---------- Render ----------
  return (
    <div className="flex gap-2 items-start p-4 border-b border-gray-700">
      <div className="avatar">
        <Link
          to={`/profile/${postOwner.username}`}
          className="w-8 rounded-full overflow-hidden"
        >
          <img src={postOwner.profileImg || "/avatar-placeholder.png"} />
        </Link>
      </div>

      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex gap-2 items-center">
          <Link to={`/profile/${postOwner.username}`} className="font-bold">
            {postOwner.fullName}
          </Link>
          <span className="text-gray-700 flex gap-1 text-sm">
            <Link to={`/profile/${postOwner.username}`}>
              @{postOwner.username}
            </Link>
            <span>·</span>
            <span>{formattedDate}</span>
          </span>
          {isMyPost && (
            <span className="flex justify-end flex-1">
              {!isDeleting ? (
                <FaTrash
                  className="cursor-pointer hover:text-red-500"
                  onClick={handleDeletePost}
                />
              ) : (
                <LoadingSpinner size="sm" />
              )}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <span>{post.text}</span>
          {post.img && (
            <img
              src={post.img}
              className="h-80 object-contain rounded-lg border border-gray-700"
              alt="Post media"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-3">
          <div className="flex gap-4 items-center w-2/3 justify-between">
            {/* Comments */}
            <div
              className="flex gap-1 items-center cursor-pointer group"
              onClick={() =>
                (
                  document.getElementById(
                    "comments_modal" + post._id
                  ) as HTMLDialogElement
                )?.showModal()
              }
            >
              <FaRegComment className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
              <span className="text-sm text-slate-500 group-hover:text-sky-400">
                {post.comments.length}
              </span>
            </div>

            {/* Comments Modal */}
            <dialog
              id={`comments_modal${post._id}`}
              className="modal border-none outline-none"
            >
              <div className="modal-box rounded border border-gray-600">
                <h3 className="font-bold text-lg mb-4">COMMENTS</h3>
                <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                  {post.comments.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No comments yet 🤔 Be the first one 😉
                    </p>
                  ) : (
                    post.comments.map((c) => (
                      <div key={c._id} className="flex gap-2 items-start">
                        <div className="avatar">
                          <div className="w-8 rounded-full">
                            <img
                              src={
                                c.user.profileImg || "/avatar-placeholder.png"
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="font-bold">{c.user.fullName}</span>
                            <span className="text-gray-700 text-sm">
                              @{c.user.username}
                            </span>
                          </div>
                          <div className="text-sm">{c.text}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment */}
                <form
                  className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-2"
                  onSubmit={handlePostComment}
                >
                  <textarea
                    className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button className="btn btn-primary rounded-full btn-sm text-white px-4">
                    {isCommenting ? <LoadingSpinner size="md" /> : "Post"}
                  </button>
                </form>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button className="outline-none">close</button>
              </form>
            </dialog>

            {/* Repost */}
            <div className="flex gap-1 items-center group cursor-pointer">
              <BiRepost className="w-6 h-6 text-slate-500 group-hover:text-green-500" />
              <span className="text-sm text-slate-500 group-hover:text-green-500">
                0
              </span>
            </div>

            {/* Like */}
            <div
              className="flex gap-1 items-center group cursor-pointer"
              onClick={handleLikePost}
            >
              {isLiking ? (
                <LoadingSpinner size="sm" />
              ) : (
                <FaRegHeart
                  className={`w-4 h-4 cursor-pointer ${
                    isLiked
                      ? "text-pink-500"
                      : "text-slate-500 group-hover:text-pink-500"
                  }`}
                />
              )}
              <span
                className={`text-sm ${
                  isLiked
                    ? "text-pink-500"
                    : "text-slate-500 group-hover:text-pink-500"
                }`}
              >
                {post.likes.length}
              </span>
            </div>
          </div>

          {/* Bookmark */}
          <div className="flex w-1/3 justify-end gap-2 items-center">
            <FaRegBookmark className="w-4 h-4 text-slate-500 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;

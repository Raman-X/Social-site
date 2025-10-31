import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";

import Posts from "../../components/common/Posts";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import EditProfileModal from "./EditProfileModal";

import { FaArrowLeft } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import { FaLink } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatMemberSinceDate } from "../../utils/date";

import useFollow from "../../hooks/useFollow";
import toast from "react-hot-toast";

// ---------- Types ----------
interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string; // Added to match AuthUser
  bio?: string;
  profileImg?: string;
  coverImg?: string;
  link?: string;
  followers: string[];
  following: string[];
  createdAt: string;
}

type FeedType = "posts" | "likes";

const ProfilePage: React.FC = () => {
  const [coverImg, setCoverImg] = useState<string | null>(null);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<FeedType>("posts");

  const coverImgRef = useRef<HTMLInputElement | null>(null);
  const profileImgRef = useRef<HTMLInputElement | null>(null);

  const { username } = useParams<{ username: string }>();

  const { follow, isPending } = useFollow();
  const queryClient = useQueryClient();

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
  const {
    data: user,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<User>({
    queryKey: ["userProfile", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/profile/${username}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data as User;
    },
  });

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation<
    User,
    Error
  >({
    mutationFn: async () => {
      const res = await fetch(`/api/users/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImg, profileImg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data as User;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["authUser"] }),
        queryClient.invalidateQueries({ queryKey: ["userProfile", username] }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const isMyProfile = authUser?._id === user?._id;
  const memberSinceDate = user ? formatMemberSinceDate(user.createdAt) : "";
  const amIFollowing = authUser?.following.includes(user?._id ?? "");

  const handleImgChange = (
    e: ChangeEvent<HTMLInputElement>,
    state: "coverImg" | "profileImg"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (state === "coverImg") setCoverImg(result);
      if (state === "profileImg") setProfileImg(result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    refetch();
  }, [username, refetch]);

  return (
    <div className="flex-[4_4_0] border-r border-gray-700 min-h-screen">
      {(isLoading || isRefetching) && <ProfileHeaderSkeleton />}
      {!isLoading && !isRefetching && !user && (
        <p className="text-center text-lg mt-4">User not found</p>
      )}

      {!isLoading && user && (
        <div className="flex flex-col">
          {/* Profile Header */}
          <div className="flex gap-10 px-4 py-2 items-center">
            <Link to="/">
              <FaArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex flex-col">
              <p className="font-bold text-lg">{user.fullName}</p>
              <span className="text-sm text-slate-500">
                {user.following.length} posts
              </span>
            </div>
          </div>

          {/* Cover Image */}
          <div className="relative group/cover">
            <img
              src={coverImg || user.coverImg || "/cover.png"}
              className="h-52 w-full object-cover"
              alt="cover image"
            />
            {isMyProfile && (
              <div
                className="absolute top-2 right-2 rounded-full p-2 bg-gray-800 bg-opacity-75 cursor-pointer opacity-0 group-hover/cover:opacity-100 transition duration-200"
                onClick={() => coverImgRef.current?.click()}
              >
                <MdEdit className="w-5 h-5 text-white" />
              </div>
            )}

            <input
              type="file"
              hidden
              accept="image/*"
              ref={coverImgRef}
              onChange={(e) => handleImgChange(e, "coverImg")}
            />
            <input
              type="file"
              hidden
              accept="image/*"
              ref={profileImgRef}
              onChange={(e) => handleImgChange(e, "profileImg")}
            />

            {/* User Avatar */}
            <div className="avatar absolute -bottom-16 left-4">
              <div className="w-32 rounded-full relative group/avatar">
                <img
                  src={
                    profileImg || user.profileImg || "/avatar-placeholder.png"
                  }
                />
                {isMyProfile && (
                  <div className="absolute top-5 right-3 p-1 bg-primary rounded-full group-hover/avatar:opacity-100 opacity-0 cursor-pointer">
                    <MdEdit
                      className="w-4 h-4 text-white"
                      onClick={() => profileImgRef.current?.click()}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="flex justify-end px-4 mt-5">
            {isMyProfile && <EditProfileModal authUser={authUser} />}
            {!isMyProfile && (
              <button
                className="btn btn-outline rounded-full btn-sm"
                onClick={() => user?._id && follow(user._id)}
              >
                {isPending && "Loading..."}
                {!isPending && amIFollowing && "Unfollow"}
                {!isPending && !amIFollowing && "Follow"}
              </button>
            )}
            {(coverImg || profileImg) && (
              <button
                className="btn btn-primary rounded-full btn-sm text-white px-4 ml-2"
                onClick={() => updateProfile()}
              >
                {isUpdatingProfile ? "Updating..." : "Update"}
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex flex-col gap-4 mt-14 px-4">
            <span className="font-bold text-lg">{user.fullName}</span>
            <span className="text-sm text-slate-500">@{user.username}</span>
            <span className="text-sm my-1">{user.bio}</span>

            <div className="flex gap-2 flex-wrap">
              {user.link && (
                <div className="flex gap-1 items-center">
                  <FaLink className="w-3 h-3 text-slate-500" />
                  <a
                    href={user.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {user.link}
                  </a>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <IoCalendarOutline className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-500">
                  {memberSinceDate}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex gap-1 items-center">
                <span className="font-bold text-xs">
                  {user.following.length}
                </span>
                <span className="text-slate-500 text-xs">Following</span>
              </div>
              <div className="flex gap-1 items-center">
                <span className="font-bold text-xs">
                  {user.followers.length}
                </span>
                <span className="text-slate-500 text-xs">Followers</span>
              </div>
            </div>
          </div>

          {/* Feed Type Tabs */}
          <div className="flex w-full border-b border-gray-700 mt-4">
            <div
              className="flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 relative cursor-pointer"
              onClick={() => setFeedType("posts")}
            >
              Posts
              {feedType === "posts" && (
                <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
              )}
            </div>
            <div
              className="flex justify-center flex-1 p-3 text-slate-500 hover:bg-secondary transition duration-300 relative cursor-pointer"
              onClick={() => setFeedType("likes")}
            >
              Likes
              {feedType === "likes" && (
                <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
              )}
            </div>
          </div>

          <Posts feedType={feedType} username={username} userId={user?._id} />
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoCloseSharp } from "react-icons/io5";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import type { FormEvent, ChangeEvent } from "react";

// ---------- Types ----------
interface User {
  _id: string;
  username: string;
  fullName: string;
  profileImg?: string;
}

interface CreatePostInput {
  text: string;
  img: string | null;
}

interface PostResponse {
  _id: string;
  text: string;
  img?: string;
  user: User;
  likes: string[];
  comments: any[];
}

// ---------- Component ----------
const CreatePost: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [img, setImg] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement | null>(null);

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

  const {
    mutate: createPost,
    isPending,
    isError,
    error,
  } = useMutation<PostResponse, Error, CreatePostInput>({
    mutationFn: async ({
      text,
      img,
    }: CreatePostInput): Promise<PostResponse> => {
      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, img }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      return data;
    },

    onSuccess: () => {
      setText("");
      setImg(null);
      toast.success("Post created successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() && !img) {
      toast.error("Please enter some text or upload an image.");
      return;
    }
    createPost({ text, img });
  };

  const handleImgChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex p-4 items-start gap-4 border-b border-gray-700">
      <div className="avatar">
        <div className="w-8 rounded-full">
          <img
            src={authUser?.profileImg || "/avatar-placeholder.png"}
            alt={authUser?.fullName || "User avatar"}
          />
        </div>
      </div>

      <form className="flex flex-col gap-2 w-full" onSubmit={handleSubmit}>
        <textarea
          className="textarea w-full p-0 text-lg resize-none border-none focus:outline-none border-gray-800"
          placeholder="What is happening?!"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {img && (
          <div className="relative w-72 mx-auto">
            <IoCloseSharp
              className="absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer"
              onClick={() => {
                setImg(null);
                if (imgRef.current) imgRef.current.value = "";
              }}
            />
            <img
              src={img}
              alt="Preview"
              className="w-full mx-auto h-72 object-contain rounded"
            />
          </div>
        )}

        <div className="flex justify-between border-t py-2 border-t-gray-700">
          <div className="flex gap-1 items-center">
            <CiImageOn
              className="fill-primary w-6 h-6 cursor-pointer"
              onClick={() => imgRef.current?.click()}
            />
            <BsEmojiSmileFill className="fill-primary w-5 h-5 cursor-pointer" />
          </div>

          <input
            type="file"
            accept="image/*"
            hidden
            ref={imgRef}
            onChange={handleImgChange}
          />

          <button
            type="submit"
            className="btn btn-primary rounded-full btn-sm text-white px-4"
            disabled={isPending}
          >
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>

        {isError && (
          <div className="text-red-500 text-sm mt-1">
            {error?.message || "Failed to create post"}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePost;

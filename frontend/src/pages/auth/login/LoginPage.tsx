import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";

import LogoSvg from "../../../components/svgs/Logo";

import { MdOutlineMail, MdPassword } from "react-icons/md";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface LoginFormData {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });

  const queryClient = useQueryClient();

  const {
    mutate: loginMutation,
    isError,
    error,
    isPending,
    // rename isLoading to isPending
  } = useMutation({
    mutationFn: async ({ username, password }: LoginFormData) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Logged in successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation(formData);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-7xl mx-auto flex h-screen">
      <div className="flex-1 hidden lg:flex items-center justify-center">
        <LogoSvg className="lg:w-2/3 fill-white" />
      </div>
      <div className="flex-1 flex flex-col justify-center items-center">
        <form className="flex gap-4 flex-col" onSubmit={handleSubmit}>
          <LogoSvg className="w-24 lg:hidden fill-white mx-auto" />
          <h1 className="text-4xl font-extrabold text-center sm:text-start text-white">
            {"Let's"} go.
          </h1>

          <label className="input input-bordered rounded flex items-center gap-2">
            <MdOutlineMail />
            <input
              type="text"
              className="grow"
              placeholder="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
            />
          </label>

          <label className="input input-bordered rounded flex items-center gap-2">
            <MdPassword />
            <input
              type="password"
              className="grow"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
            />
          </label>

          <button className="btn rounded-full btn-primary text-white">
            {isPending ? "Loading..." : "Login"}
          </button>

          {isError && (
            <p className="text-red-500">{(error as Error)?.message}</p>
          )}
        </form>

        <div className="flex flex-col gap-2 mt-4">
          <p className="text-white text-lg">{"Don't"} have an account?</p>
          <Link to="/signup">
            <button className="btn rounded-full btn-primary text-white btn-outline w-full">
              Sign up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

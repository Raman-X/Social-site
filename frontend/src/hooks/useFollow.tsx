import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// ---------- Types ----------
interface FollowResponse {
  success: boolean;
  message?: string;
}

const useFollow = () => {
  const queryClient = useQueryClient();

  const { mutate: follow, isPending } = useMutation<
    FollowResponse, // Return type
    Error, // Error type
    string // Variable type (userId)
  >({
    mutationFn: async (userId: string): Promise<FollowResponse> => {
      const res = await fetch(`/api/users/follow/${userId}`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong!");
      }

      return { success: true, message: data.message };
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] }),
        queryClient.invalidateQueries({ queryKey: ["authUser"] }),
      ]);
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return { follow, isPending };
};

export default useFollow;

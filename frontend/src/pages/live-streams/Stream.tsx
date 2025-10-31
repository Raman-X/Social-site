import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

function randomID(len: number) {
  const chars =
    "12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getUrlParams(url = window.location.href) {
  const urlStr = url.split("?")[1];
  return new URLSearchParams(urlStr);
}

const Stream = ({ user }: any) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const roomID = getUrlParams().get("roomID") || randomID(5);
  const roleStr = getUrlParams().get("role") || "Host";

  const role =
    roleStr === "Host"
      ? ZegoUIKitPrebuilt.Host
      : roleStr === "Cohost"
        ? ZegoUIKitPrebuilt.Cohost
        : ZegoUIKitPrebuilt.Audience;

  const sharedLinks: { name?: string; url?: string }[] = [];

  if (role === ZegoUIKitPrebuilt.Host || role === ZegoUIKitPrebuilt.Cohost) {
    sharedLinks.push({
      name: "Join as co-host",
      url: `${window.location.protocol}//${window.location.host}${window.location.pathname}?roomID=${roomID}&role=Cohost`,
    });
  }

  sharedLinks.push({
    name: "Join as audience",
    url: `${window.location.protocol}//${window.location.host}${window.location.pathname}?roomID=${roomID}&role=Audience`,
  });

  const createLiveStream = useMutation({
    mutationFn: async (newStream: { name: string; url: string }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/live-stream/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(newStream),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Live stream created successfully:", data);
    },
    onError: (err: any) => {
      console.error("Failed to create live stream:", err.response?.data || err);
    },
  });

  const deleteLiveStream = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/live-stream/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete stream: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      console.log("Live stream deleted successfully");
    },
    onError: (err: any) => {
      console.error("Failed to delete live stream:", err);
    },
  });

  const streamIdRef = useRef<string | null>(null);

  useEffect(() => {
    const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

    if (!appID || !serverSecret) {
      console.error(
        "Missing Zego appID or serverSecret in environment variables"
      );
      return;
    }

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      user._id,
      user.username
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: containerRef.current!,
      sharedLinks,
      scenario: {
        mode: ZegoUIKitPrebuilt.LiveStreaming,
        config: { role },
      },
      onJoinRoom: () => {
        console.log("Live stream started", sharedLinks);

        if (role === ZegoUIKitPrebuilt.Host) {
          createLiveStream.mutate(
            {
              name: `${user.username}'s Stream`,
              url: sharedLinks[0]?.url || window.location.href,
            },
            {
              onSuccess: (data: any) => {
                streamIdRef.current = data._id;
              },
            }
          );
        }
      },
      onLeaveRoom: () => {
        console.log("Stream ended");

        if (streamIdRef.current) {
          deleteLiveStream.mutate(streamIdRef.current);
        }
      },
    });
  }, []);

  return (
    <div className="mt-4">
      <div ref={containerRef} className="myCallContainer"></div>
    </div>
  );
};

export default Stream;

import { useEffect, useRef } from "react";
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

const TestStream = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const roomID = getUrlParams().get("roomID") || randomID(5);
  const roleStr = getUrlParams().get("role") || "Host";

  const role =
    roleStr === "Host"
      ? ZegoUIKitPrebuilt.Host
      : roleStr === "Cohost"
        ? ZegoUIKitPrebuilt.Cohost
        : ZegoUIKitPrebuilt.Audience;

  // ✅ Explicitly type sharedLinks to match Zego config
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
      randomID(5), // userID
      "User_" + randomID(5) // userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: containerRef.current!,
      sharedLinks, // ✅ Now correctly typed
      scenario: {
        mode: ZegoUIKitPrebuilt.LiveStreaming,
        config: {
          role,
        },
      },
    });
  }, [roomID, role]);

  return (
    <div
      ref={containerRef}
      className="myCallContainer"
      style={{ width: "100vw", height: "100vh" }}
    ></div>
  );
};

export default TestStream;

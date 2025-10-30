import { useState } from "react";
import Posts from "../../components/common/Posts";
import CreatePost from "./CreatePost";

// ---------- Types ----------
type FeedType = "forYou" | "following";

// ---------- Component ----------
const HomePage: React.FC = () => {
  const [feedType, setFeedType] = useState<FeedType>("forYou");

  return (
    <div className="w-full max-w-xl">
      <div className="flex-[4_4_0] mr-auto border-x border-gray-700 min-h-screen ">
        {/* Header Tabs */}
        <div className="flex w-full border-b border-b-gray-700">
          {/* For You Tab */}
          <div
            className="flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 cursor-pointer relative"
            onClick={() => setFeedType("forYou")}
          >
            For you
            {feedType === "forYou" && (
              <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary"></div>
            )}
          </div>

          {/* Following Tab */}
          <div
            className="flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 cursor-pointer relative"
            onClick={() => setFeedType("following")}
          >
            Following
            {feedType === "following" && (
              <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary"></div>
            )}
          </div>
        </div>

        {/* Create Post Input */}
        <CreatePost />

        {/* Feed Posts */}
        <Posts feedType={feedType} />
      </div>
    </div>
  );
};

export default HomePage;

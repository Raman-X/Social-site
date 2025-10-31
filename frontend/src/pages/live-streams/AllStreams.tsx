import { useQuery } from "@tanstack/react-query";

interface User {
  _id: string;
  username: string;
  fullName: string;
  profileImg?: string;
}

interface Stream {
  _id: string;
  user: User;
  name: string;
  url: string;
  createdAt: string;
}

const AllStreams = () => {
  const { isLoading, error, data } = useQuery<Stream[]>({
    queryKey: ["allStreams"],
    queryFn: () =>
      fetch("/api/live-stream/all", {
        method: "GET",
        credentials: "include",
      }).then((res) => res.json()),
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>An error occurred: {(error as any).message}</p>;

  return (
    <div className="p-4 flex-1">
      {data && data.length > 0 ? (
        <>
          <h1 className="mb-4 text-xl font-bold text-white">All the streams</h1>

          <ul className="menu w-full bg-base-100 rounded-lg shadow-lg">
            {data.map((stream) => {
              const url = new URL(stream.url);
              url.searchParams.set("role", "Audience");

              return (
                <li key={stream._id}>
                  <a
                    href={url.toString()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 hover:bg-gray-800 transition-colors rounded-lg"
                  >
                    <img
                      src={stream.user.profileImg || "/avatar-placeholder.png"}
                      alt={stream.user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {/* Pulsating red dot */}
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse inline-block"></span>
                        <span className="font-bold text-white">
                          {stream.name}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        @{stream.user.username}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {new Date(stream.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="text-gray-400">No live streams currently.</p>
      )}
    </div>
  );
};

export default AllStreams;

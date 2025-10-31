import { useQuery } from "@tanstack/react-query";

const AllStreams = () => {
  const { isPending, error, data } = useQuery({
    queryKey: ["repoData"],
    queryFn: () =>
      fetch("/api/live-stream/all", {
        method: "GET",
        credentials: "include",
      }).then((res) => res.json()),
  });
  console.log(data);
  if (isPending) return "Loading...";

  if (error) return "An error has occurred: " + error.message;
  return (
    <>
      <div className="flex-1">
        {/* <h1>{data.name}</h1>
        <p>{data.url}</p> */}
      </div>
    </>
  );
};

export default AllStreams;

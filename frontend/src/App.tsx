import { useEffect } from "react";

const App = () => {
  useEffect(() => {
    fetch("/api/auth/me").then((res) => {
      console.log(res);
    });
  }, []);
  return <div>App</div>;
};

export default App;

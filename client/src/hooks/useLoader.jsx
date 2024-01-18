import { useState, useEffect } from "react";

function useLoader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    let timeout;

    if (!isCurrent) return;
    timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, []);

  return { isLoading };
}

export default useLoader;

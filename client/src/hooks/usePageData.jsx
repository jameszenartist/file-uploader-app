import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useContext } from "react";
import { useLocation } from "react-router-dom";
import { FileContext } from "../context/FileContext";

function usePageData() {
  const queryClient = useQueryClient();
  const { makeRequest } = useContext(FileContext);
  const location = useLocation();

  const path = location.pathname.slice(1);

  const { isPending, isError, data, error } = useQuery({
    queryKey: ["path", `${path}`],
    queryFn: async () => {
      try {
        const result = await makeRequest(`${path}`);
        if (!result) return [];
        return result;
      } catch (err) {
        if (err) throw err;
      }
    },
    staleTime: 60 * 1000,
  });
  return { isPending, isError, data, error, queryClient };
}

export default usePageData;

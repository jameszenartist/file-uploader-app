import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

import React from "react";
import { FileProvider } from "./context/FileContext";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FileProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </FileProvider>
  </React.StrictMode>
);

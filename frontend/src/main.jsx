import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App.jsx";
import { store } from "./store/store.js";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GlobalErrorBoundary from "./components/errors/ErrorBoundary.jsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <>
      <GlobalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            <App />
          </Provider>
        </QueryClientProvider>
      </GlobalErrorBoundary>

      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "12px",
            padding: "16px 20px",
            fontSize: "15px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            backdropFilter: "blur(5px)",
            color: "#fff",
            fontWeight: 500,
          },
        }}
      />
    </>
  </BrowserRouter>
);

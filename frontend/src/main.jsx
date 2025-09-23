import { createRoot } from "react-dom/client"
import { Toaster } from "sonner"
import { Provider } from "react-redux"
import "./index.css"
import App from "./App.jsx"
import { store } from "./store/store.js"
// import React from "react"
import { BrowserRouter } from "react-router-dom"

createRoot(document.getElementById("root")).render(
  <BrowserRouter>

    <>
      <Provider store={store}>
        <App />
      </Provider>
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
            fontWeight: 500
          }
        }}

      />
    </>
  </BrowserRouter>
)

// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import store from "./store";
import router from "./router";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import { X } from "lucide-react"; // 👈 lep moderni X

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "14px",
              padding: "14px 18px",
              fontWeight: 600,
              fontSize: "15px",
              color: "#fff",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            },
            success: {
              style: {
                background: "linear-gradient(135deg,#34d399,#059669)", // zelena
              },
            },
            error: {
              style: {
                background: "linear-gradient(135deg,#f87171,#dc2626)", // crvena
              },
            },
            loading: {
              style: {
                background: "linear-gradient(135deg,#60a5fa,#2563eb)", // plava
              },
            },
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ message }) => (
                <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                  <span style={{ flex: 1 }}>{message}</span>
                  <button
                    aria-label="Close"
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      color: "#fff",
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.35)";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </ToastBar>
          )}
        </Toaster>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./modules/auth/index.js";
import { ErrorBoundary } from "./modules/error/index.js";
import App from "./App.jsx";
import "./styles/main.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);

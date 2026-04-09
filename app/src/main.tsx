import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/i18n";
import "./index.css";
import App from "./App";
import { applyTheme, getStoredTheme } from "./lib/theme";

// Re-apply the persisted theme during hydration so the React tree and the
// inline bootstrap script in index.html resolve to the same visual mode.
applyTheme(getStoredTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

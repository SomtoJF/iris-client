import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./App.css";
import "./index.css";
import App from "./App.tsx";
import { initializeFerno } from "./lib/ferno";

initializeFerno();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

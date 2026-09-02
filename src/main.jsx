// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./assets/style.css";
import "./assets/dashboard.css";
import "./assets/admin.css";
// import ScrollToTop from "./components/ScrollToTop";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    {/* <ScrollToTop /> */}
    <App />
  </BrowserRouter>
);

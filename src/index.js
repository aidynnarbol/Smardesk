import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js"; // 🔥 добавлено .js
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./tailwind.css"; // Import Tailwind directives
import { ThemeProvider } from './contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

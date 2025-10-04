import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./tailwind.css"; // Import Tailwind directives
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary'; // Import ErrorBoundary
import { initSecurityChecks } from './utils/securityChecks';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary> {/* Wrap App with ErrorBoundary */}
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Initialize security checks
initSecurityChecks();

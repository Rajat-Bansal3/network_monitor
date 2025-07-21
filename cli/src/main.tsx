import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./components/providers/theme-provider.tsx";
import { AuthProvider } from "./components/providers/auth-provider.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
);

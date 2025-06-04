import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import "./index.css";
import App from "./App.tsx";
import AppNavbar from "./components/custom/AppNavbar.tsx";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import "aos/dist/aos.css";
import { useAuthStore } from "./lib/store.ts";
import api from "./lib/axiosinstance.ts";
import { useEffect, useState } from "react";

const Root = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/user/auth/getuser");
        const userData = res.data.user;
        if (userData) setUser(userData);
      } catch (err) {
        // No need to redirect here
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return null;

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Toaster />
      <AppNavbar />
      <App />
    </ThemeProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <Router>
    <Root />
  </Router>
);

import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import "./index.css";
import App from "./App.tsx";
import AppNavbar from "./components/custom/AppNavbar.tsx";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AOS from "aos";
import "aos/dist/aos.css";
  

createRoot(document.getElementById("root")!).render(
  <Router>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <Toaster />
      <div className="">
        <AppNavbar />
        <div className="">
          <App />
        </div>
      </div>
    </ThemeProvider>
  </Router>
);

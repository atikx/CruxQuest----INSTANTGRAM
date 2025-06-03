import { Button } from "@/components/ui/button";
import { Routes, Route } from "react-router-dom";
import Auth from "./pages/auth/Auth";
import Home from "./pages/home/Home";
import { Navigate } from "react-router-dom";
function App() {
  return (
    <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Navigate to="/ home" />} />
    </Routes>
  );
}

export default App;

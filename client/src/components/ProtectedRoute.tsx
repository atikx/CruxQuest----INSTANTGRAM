// components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/lib/store";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = useAuthStore((state) => state.user);
  return user ? children : <Navigate to="/auth" replace />;
};

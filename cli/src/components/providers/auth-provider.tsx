import { checkAuth } from "@/api/auth";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  refreshAuth: () => Promise<void>;
}
const authContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    setLoading(true);
    const result = await checkAuth();
    setIsAuthenticated(result);
    setLoading(false);
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <authContext.Provider value={{ isAuthenticated, loading, refreshAuth }}>
      {children}
    </authContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(authContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

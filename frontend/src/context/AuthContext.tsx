import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

type User = {
  id: number;
  fullName: string;
  email: string;
  role: "UZYTKOWNIK" | "PRACOWNIK" | "ADMINISTRATOR";
  twoFactorEnabled: boolean;
};

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // sprawdzamy zalogowanego usera przy starcie (gość = 200 + null, bez 401)
  useEffect(() => {
    const handleCheckAuth = async () => {
      try {
        const res = await axios.get<User | null>("/api/auth/info", {
          withCredentials: true,
        });
        setUser(res.data ?? null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    handleCheckAuth();
  }, []);

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.log("Błąd wylogowania: ", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

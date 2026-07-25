import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router";

const DisableTotpForm = () => {
  const { user, setUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const handleDisable2FA = async () => {
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/2fa/disable", {}, {
        withCredentials: true,
      });
      
      toast.success(res.data.msg);
      setUser({ ...user, twoFactorEnabled: false });
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Błąd wyłączania 2FA:", err);
      toast.error("Wystąpił nieoczekiwany błąd");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleDisable2FA}
        disabled={loading}
        variant="destructive"
      >
        {loading ? "Wyłączanie..." : "Wyłącz 2FA"}
      </Button>
    </div>
  );
};

export default DisableTotpForm;
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router";

const Profile = () => {
  const { user, loading, setUser } = useAuth();

  if (loading) return null;

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.error("Błąd podczas wylogowywania:", err);
    }
  };

  const trigger = (
    <DropdownMenuTrigger asChild>
      <div className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition">
        <div className="hidden flex-col text-right text-sm text-black md:flex dark:text-white">
          <span className="leading-none font-medium">
            {user?.fullName || "Gość"}
          </span>
          <span className="text-xs text-black/70 dark:text-white/70">
            {user?.email || "zaloguj się, aby mieć możliwość adopcji."}
          </span>
        </div>
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={user ? "/admin-logged-avatar.png" : "/not-logged-avatar.png"}
            alt={user?.fullName}
          />
          <AvatarFallback>{user?.fullName}</AvatarFallback>
        </Avatar>
      </div>
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {trigger}
      <DropdownMenuContent
        align="end"
        className="bg-popover w-60 rounded-xl border border-white/10 p-2 shadow-lg backdrop-blur-md"
      >
        <DropdownMenuLabel>Moje konto</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/admin/konto">Panel admina</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer font-semibold text-red-600"
          onClick={handleLogout}
        >
          Wyloguj się
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Profile;

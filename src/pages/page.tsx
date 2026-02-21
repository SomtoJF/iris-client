import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useFetchCurrentUser } from "@/hooks/user";
import { useUserStore } from "@/zustand/userstore";
import { Loader } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { user, isPending, error } = useFetchCurrentUser();
  const { setUser, clearUser } = useUserStore();

  useEffect(() => {
    if (isPending) return;

    if (user) {
      setUser(user);
      navigate("/dashboard");
    } else {
      clearUser();
      navigate("/login");
    }
  }, [user, isPending, error, navigate, setUser, clearUser]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

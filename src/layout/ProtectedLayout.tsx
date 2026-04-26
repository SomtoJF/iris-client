import { Navigate, Outlet } from "react-router";
import { useFetchCurrentUser } from "@/hooks/user";
import { useUserStore } from "@/zustand/userstore";
import { Loader } from "lucide-react";
import { useEffect } from "react";

export function ProtectedLayout() {
  const { user, isFetching, isPending } = useFetchCurrentUser();
  const { setUser, clearUser } = useUserStore();

  useEffect(() => {
    if (isFetching) return;

    if (user) {
      setUser(user);
    } else {
      clearUser();
    }
  }, [user, isFetching, setUser, clearUser]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isResumeOnboardingComplete) {
    return <Navigate to="/onboarding/resume" replace />;
  }

  if (!user.isOnboardingComplete) {
    return <Navigate to="/onboarding/application" replace />;
  }

  return <Outlet />;
}

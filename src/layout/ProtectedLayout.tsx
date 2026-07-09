import { Navigate, Outlet } from "react-router";
import { useFetchCurrentUser } from "@/hooks/user";
import { useUserStore } from "@/zustand/userstore";
import { ApiError } from "@/services/api";
import { Loader } from "lucide-react";
import { useEffect } from "react";

export function ProtectedLayout() {
  const { user, isFetching, isPending, error } = useFetchCurrentUser();
  const { setUser, clearUser } = useUserStore();

  // react-query keeps the last successful user after a failed refetch, so an
  // expired session leaves `user` truthy — treat a 401 as logged out regardless
  const sessionExpired = error instanceof ApiError && error.status === 401;

  useEffect(() => {
    if (isFetching) return;

    if (sessionExpired) {
      clearUser();
    } else if (user) {
      setUser(user);
    } else {
      clearUser();
    }
  }, [user, isFetching, sessionExpired, setUser, clearUser]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessionExpired || !user) {
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

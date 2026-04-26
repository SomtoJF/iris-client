import "./App.css";
import Home from "./pages/page";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { RealtimeEventProvider } from "./context/RealTimeEventContext";
import Login from "./pages/login/page";
import Signup from "./pages/signup/page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./pages/dashboard/page";
import { ProtectedLayout } from "./layout/ProtectedLayout";
import { AuthLayout } from "./layout/AuthLayout";
import ResumeOnboardingPage from "./pages/onboarding/resume/page";
import ApplicationOnboardingPage from "./pages/onboarding/application/page";
import SettingsLayout from "./layout/SettingsLayout";
import ApplicationProfile from "./pages/settings/application-profile/ApplicationProfile";
import Account from "./pages/settings/account/Account";
import AdminPage from "./pages/settings/admin/page";
import FeedbackPage from "./pages/feedback/page";
import FeedbackLayout from "./layout/FeedbackLayout";
import NewFeedbackPage from "./pages/feedback/new/page";
import FeedbackIssuePage from "./pages/feedback/issue/[id]/page";
import { TooltipProvider } from "./components/ui/tooltip";
import DashboardLayout from "./layout/DashboardLayout";

function App() {
  const queryClient = new QueryClient();
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <RealtimeEventProvider>
          <TooltipProvider>
            <Toaster />
            <Routes>
              <Route path="/" element={<Home />} />

              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Route>

              <Route
                path="/onboarding/resume"
                element={<ResumeOnboardingPage />}
              />
              <Route
                path="/onboarding/application"
                element={<ApplicationOnboardingPage />}
              />

              <Route element={<ProtectedLayout />}>
                {/* Dashboard */}
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                </Route>

                {/* Feedback */}
                <Route element={<FeedbackLayout />}>
                  <Route path="/feedback" element={<FeedbackPage />} />
                  <Route path="/feedback/new" element={<NewFeedbackPage />} />
                  <Route path="/feedback/:id" element={<FeedbackIssuePage />} />
                </Route>

                {/* Settings */}
                <Route path="/settings" element={<SettingsLayout />}>
                  <Route
                    path="application-profile"
                    element={<ApplicationProfile />}
                  />
                  <Route path="account" element={<Account />} />
                  <Route path="admin" element={<AdminPage />} />
                </Route>
              </Route>
            </Routes>
          </TooltipProvider>
        </RealtimeEventProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;

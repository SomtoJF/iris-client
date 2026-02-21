import "./App.css";
import Home from "./pages/page";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { RealtimeEventProvider } from "./context/RealTimeEventContext";
import Login from "./pages/login/page";
import Signup from "./pages/signup/page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./pages/dashboard/page";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";
import { AuthLayout } from "./components/layout/AuthLayout";

function App() {
  const queryClient = new QueryClient();
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <RealtimeEventProvider>
          <Toaster />
          <Routes>
            <Route path="/" element={<Home />} />

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
          </Routes>
        </RealtimeEventProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;

import "./App.css";
import Home from "./pages/page";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { RealtimeEventProvider } from "./context/RealTimeEventContext";
import Login from "./pages/login/page";
import Signup from "./pages/signup/page";

function App() {
  return (
    <BrowserRouter>
      <RealtimeEventProvider>
        <Toaster />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </RealtimeEventProvider>
    </BrowserRouter>
  );
}

export default App;

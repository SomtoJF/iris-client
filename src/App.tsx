import "./App.css";
import Home from "./pages/page";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { RealtimeEventProvider } from "./context/RealTimeEventContext";

function App() {
  return (
    <BrowserRouter>
      <RealtimeEventProvider>
        <Toaster />
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </RealtimeEventProvider>
    </BrowserRouter>
  );
}

export default App;

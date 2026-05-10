import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/home";
import ReportIssue from "./pages/reportIssue";
import Navbar from "./components/navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/report" element={<ReportIssue />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
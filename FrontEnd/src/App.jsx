import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateIssue from "./pages/CreateIssue";
import Profile from "./pages/Profile";
<Route path="/profile" element={<Profile />} />
function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

     <Route
        path="/create-issue"
        element={
          <ProtectedRoute>
            <CreateIssue />
          </ProtectedRoute>
        }
      />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
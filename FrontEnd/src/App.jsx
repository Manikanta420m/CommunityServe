import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateIssue from "./pages/CreateIssue";
import Profile from "./pages/Profile";
import IssueDetails from "./pages/IssueDetails";
import MyIssues from "./pages/MyIssues";
import AdminDashboard from "./pages/AdminDashboard";
import Analytics from "./pages/Analytics";
import UserManagement from "./pages/UserManagement";
import AuthorityDashboard from "./pages/AuthorityDashboard";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/create-issue" element={<ProtectedRoute><CreateIssue /></ProtectedRoute>} />
        <Route path="/issues/:id" element={<ProtectedRoute><IssueDetails /></ProtectedRoute>} />
        <Route path="/my-issues" element={<ProtectedRoute><MyIssues /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/authority" element={<ProtectedRoute><AuthorityDashboard /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

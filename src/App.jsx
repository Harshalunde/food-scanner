import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Scanner from "./pages/Scanner";
import Insights from "./pages/Insights";
import Compare from "./pages/Compare";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Protected route wrapper
const Protected = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
};

// Main app
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* 👇 Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 👇 Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 👇 Admin route */}
          <Route
            path="/admin"
            element={
              <Protected role="admin">
                <AdminDashboard />
              </Protected>
            }
          />

          {/* 👇 User routes (scanner + dashboard) */}
          <Route
            path="/user/*"
            element={
              <Protected role="user">
                <div className="flex min-h-screen bg-gray-50">
                  <Sidebar />
                  <main className="flex-1 p-6">
                    <Header title="Food Health Dashboard" />
                    <Routes>
                      <Route path="/" element={<Scanner />} />
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/compare" element={<Compare />} />
                    </Routes>
                  </main>
                </div>
              </Protected>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

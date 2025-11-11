import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UserDashboard() {
  const { logout, user } = useAuth();
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-indigo-700">Welcome, {user.email}</h1>
      <div className="mt-4 flex gap-3">
        <Link to="/scanner" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Go to Food Scanner</Link>
        <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Logout</button>
      </div>
    </div>
  );
}

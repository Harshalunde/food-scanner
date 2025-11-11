import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // ✅ Login logic
  const login = (email, password) => {
    // Admin
    if (email === "admin" && password === "123456") {
      const admin = { email: "admin", role: "admin" };
      setUser(admin);
      localStorage.setItem("user", JSON.stringify(admin));
      navigate("/admin");
      return;
    }

    // Normal User
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const existing = users.find((u) => u.email === email && u.password === password);
    if (existing) {
      const loggedUser = { ...existing, role: "user" };
      setUser(loggedUser);
      localStorage.setItem("user", JSON.stringify(loggedUser));
      navigate("/user"); // ✅ redirect to user dashboard path
    } else {
      alert("Invalid credentials or user not registered.");
    }
  };

  // ✅ Signup
  const signup = (email, password) => {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.find((u) => u.email === email)) {
      alert("User already exists.");
      return;
    }
    users.push({ email, password });
    localStorage.setItem("users", JSON.stringify(users));
    alert("Signup successful! You can now login.");
    navigate("/login"); // ✅ redirect to login
  };

  // ✅ Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login"); // ✅ go back to login screen
  };

  // ✅ Return context provider
  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

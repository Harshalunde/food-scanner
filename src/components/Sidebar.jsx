import React from "react";
import { NavLink } from "react-router-dom";
import { ScanLine, BarChart3, Scale, Heart } from "lucide-react";

export default function Sidebar() {
  const links = [
    { to: "/", label: "Scanner", icon: <ScanLine /> },
    { to: "/insights", label: "Insights", icon: <BarChart3 /> },
    { to: "/compare", label: "Compare", icon: <Scale /> },
  ];

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-brand-700 to-brand-500 text-white p-6 shadow-xl">
      <div className="flex items-center gap-2 text-2xl font-extrabold mb-10">
        <Heart className="text-pink-300" /> FoodScanner
      </div>

      <nav className="space-y-2">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isActive ? "bg-white/20" : "hover:bg-white/10"
              }`
            }
          >
            {icon} {label}
          </NavLink>
        ))}
      </nav>

      <footer className="mt-auto text-xs text-white/70 pt-6">
        © 2025 Harshal Unde
      </footer>
    </aside>
  );
}

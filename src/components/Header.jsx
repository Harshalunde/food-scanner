import React from "react";
import { ScanLine, Bell, User } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-gray-200 flex justify-between items-center px-6 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xl font-bold text-brand-700">
        <ScanLine className="text-brand-600" /> FoodScanner Dashboard
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5 text-gray-500" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <User className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </header>
  );
}

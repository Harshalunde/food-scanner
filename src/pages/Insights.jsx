import React from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const mockData = [
  { month: "Jan", score: 78 },
  { month: "Feb", score: 84 },
  { month: "Mar", score: 91 },
  { month: "Apr", score: 87 },
  { month: "May", score: 93 },
];

export default function Insights() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <h2 className="text-2xl font-bold text-indigo-700 mb-6">Health Insights Overview</h2>
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <LineChart width={500} height={280} data={mockData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <CartesianGrid stroke="#eee" />
          <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} />
        </LineChart>
      </div>
      <div className="mt-8 text-gray-600">
        You’ve analyzed 12 products this quarter. Average health grade: <span className="font-bold text-green-600">B+</span>
      </div>
    </motion.div>
  );
}

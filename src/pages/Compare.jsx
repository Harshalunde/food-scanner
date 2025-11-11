import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Compare() {
  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <h2 className="text-2xl font-bold text-indigo-700 mb-6">Compare Two Products</h2>
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <label className="block text-gray-600 mb-1">Product 1 Barcode</label>
          <input
            value={code1}
            onChange={(e) => setCode1(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-1">Product 2 Barcode</label>
          <input
            value={code2}
            onChange={(e) => setCode2(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>
      <button className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 shadow">
        Compare
      </button>
    </motion.div>
  );
}

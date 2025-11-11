import React, { useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Camera, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function FoodScanner() {
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const n = (o, k) => (o && Number(o[k])) || 0;

  const colorFor = (v, low, med) =>
    v <= low ? "bg-green-100 text-green-800"
      : v <= med ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";

  // 🔍 Fetch + analyze
  async function handleSearch(e) {
    e.preventDefault();
    if (!barcode.trim()) return setError("Please enter a barcode.");
    setError("");
    setProduct(null);
    setLoading(true);

    try {
      const res = await fetch(`https://world.openfoodfacts.net/api/v2/product/${barcode}`);
      const data = await res.json();

      if (!data || data.status === 0) {
        throw new Error("Product not found");
      }

      const p = data.product;
      setProduct(p);
      analyze(p.nutriments);
    } catch {
      setError("❌ Product not found. Try another barcode or Demo.");
    } finally {
      setLoading(false);
    }
  }

  // 🧮 Nutrition analysis
  function analyze(nutri = {}) {
    const sugar = n(nutri, "sugars_100g");
    const fat = n(nutri, "fat_100g");
    const sat = n(nutri, "saturated-fat_100g");
    const salt = n(nutri, "salt_100g");
    const protein = n(nutri, "proteins_100g");
    const fiber = n(nutri, "fiber_100g");

    const good = [];
    const bad = [];

    if (protein >= 8) good.push("High in protein — great for muscle repair");
    if (fiber >= 3) good.push("Contains dietary fiber — supports digestion");
    if (sugar <= 5) good.push("Low sugar — daily safe choice");

    if (sugar > 22.5) bad.push("High sugar — may increase blood sugar");
    if (sat > 5) bad.push("High saturated fat — unhealthy for heart");
    if (salt > 1.5) bad.push("High sodium — may raise blood pressure");

    let score = 100 - sugar * 1.2 - sat * 2 - salt * 8 - fat * 1 + protein * 2;
    let grade = "F", color = "bg-red-600";
    if (score > 85) { grade = "A"; color = "bg-green-600"; }
    else if (score > 70) { grade = "B"; color = "bg-lime-500"; }
    else if (score > 55) { grade = "C"; color = "bg-yellow-400"; }
    else if (score > 40) { grade = "D"; color = "bg-orange-500"; }

    setAnalysis({ score: Math.round(score), grade, color, good, bad });
  }

  // ✨ UI Start
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100">
      {/* HERO SECTION */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-12 bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-500 text-white shadow-lg"
      >
        <h1 className="text-5xl font-extrabold mb-3 tracking-tight drop-shadow-lg">
          Food Scanner 2.0
        </h1>
        <p className="opacity-90 text-lg">
          Scan. Analyze. Choose smarter 🍴
        </p>
      </motion.div>

      {/* SEARCH BAR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="max-w-3xl mx-auto mt-10 px-6"
      >
        <form
          onSubmit={handleSearch}
          className="bg-white shadow-xl rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center border border-gray-100"
        >
          <input
            type="text"
            placeholder="Enter or scan barcode (e.g. 6001068586806)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="flex-1 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none text-gray-700"
          />
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow">
            Search
          </button>
          <button
            type="button"
            onClick={() => setBarcode("6001068586806")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-medium"
          >
            Demo
          </button>
        </form>

        {loading && (
          <div className="text-center mt-6 text-gray-500 animate-pulse">
            Analyzing your product...
          </div>
        )}
      </motion.div>

      {/* RESULT CARD */}
      {product && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl mt-12 p-8 border border-gray-100"
        >
          {/* PRODUCT HEADER */}
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <img
              src={product.image_front_small_url || product.image_url || "https://via.placeholder.com/200"}
              alt={product.product_name}
              className="w-48 h-48 rounded-2xl border shadow-sm object-contain bg-gray-50"
            />
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {product.product_name}
              </h2>
              <p className="text-gray-600">{product.brands}</p>
              <p className="text-gray-600">{product.quantity}</p>

              {analysis && (
                <div className={`mt-4 inline-block text-white font-semibold px-5 py-2 rounded-xl ${analysis.color} shadow-lg`}>
                  Health Grade: {analysis.grade} ({analysis.score}/100)
                </div>
              )}
            </div>
          </div>

          {/* NUTRIENT CHIPS */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className={`p-3 rounded-xl text-center font-medium ${colorFor(n(product.nutriments, "sugars_100g"), 5, 22.5)}`}>
              Sugar <div className="font-bold">{n(product.nutriments, "sugars_100g")} g</div>
            </div>
            <div className={`p-3 rounded-xl text-center font-medium ${colorFor(n(product.nutriments, "fat_100g"), 3, 17.5)}`}>
              Fat <div className="font-bold">{n(product.nutriments, "fat_100g")} g</div>
            </div>
            <div className={`p-3 rounded-xl text-center font-medium ${colorFor(n(product.nutriments, "saturated-fat_100g"), 1.5, 5)}`}>
              Saturated Fat <div className="font-bold">{n(product.nutriments, "saturated-fat_100g")} g</div>
            </div>
            <div className={`p-3 rounded-xl text-center font-medium ${colorFor(n(product.nutriments, "salt_100g"), 0.3, 1.5)}`}>
              Salt <div className="font-bold">{n(product.nutriments, "salt_100g")} g</div>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 text-center font-medium">
              Protein <div className="font-bold">{n(product.nutriments, "proteins_100g")} g</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-100 text-center font-medium">
              Energy <div className="font-bold">{n(product.nutriments, "energy-kcal_100g")} kcal</div>
            </div>
          </div>

          {/* PIE CHART */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold text-indigo-700 mb-4">
              🍽️ Nutrient Breakdown (per 100 g)
            </h3>
            <div className="flex justify-center">
              <PieChart width={320} height={260}>
                <Pie
                  dataKey="value"
                  data={[
                    { name: "Fat", value: n(product.nutriments, "fat_100g") },
                    { name: "Sugars", value: n(product.nutriments, "sugars_100g") },
                    { name: "Protein", value: n(product.nutriments, "proteins_100g") },
                    { name: "Carbs", value: n(product.nutriments, "carbohydrates_100g") },
                  ]}
                  cx="50%" cy="50%" outerRadius={90} label
                >
                  <Cell fill="#f87171" /><Cell fill="#facc15" /><Cell fill="#4ade80" /><Cell fill="#60a5fa" />
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </div>
          </div>

          {/* GOOD vs BAD */}
          {analysis && (
            <div className="mt-10 grid md:grid-cols-2 gap-5">
              <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-5 shadow-sm">
                <h4 className="text-green-700 font-semibold flex items-center gap-2 mb-3">
                  <CheckCircle2 /> Good Aspects
                </h4>
                <ul className="list-disc pl-5 text-gray-700 text-sm">
                  {analysis.good.length
                    ? analysis.good.map((g, i) => <li key={i}>{g}</li>)
                    : <li>No positive aspects found.</li>}
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-5 shadow-sm">
                <h4 className="text-red-700 font-semibold flex items-center gap-2 mb-3">
                  <AlertTriangle /> Concerns
                </h4>
                <ul className="list-disc pl-5 text-gray-700 text-sm">
                  {analysis.bad.length
                    ? analysis.bad.map((c, i) => <li key={i}>{c}</li>)
                    : <li>No major concerns.</li>}
                </ul>
              </div>
            </div>
          )}

          {/* INGREDIENTS */}
          <div className="mt-12">
            <h4 className="text-lg font-semibold text-indigo-700 mb-2 flex items-center gap-2">
              <Info /> Ingredients
            </h4>
            <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
              {product.ingredients_text || "Ingredient details unavailable."}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

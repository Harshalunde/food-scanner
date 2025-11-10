import React, { useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { HeartPulse, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function FoodScanner() {
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  // -------------------------------
  // helper for safe numeric read
  const n = (obj, key) => (obj && Number(obj[key])) || 0;

  // -------------------------------
  // health logic
  function analyzeProduct(nutri = {}) {
    const sugar = n(nutri, "sugars_100g");
    const fat = n(nutri, "fat_100g");
    const satFat = n(nutri, "saturated-fat_100g");
    const salt = n(nutri, "salt_100g");
    const protein = n(nutri, "proteins_100g");
    const fiber = n(nutri, "fiber_100g");

    const good = [];
    const concerns = [];

    if (protein >= 8) good.push("High in protein — supports muscle growth");
    if (fiber >= 3) good.push("Contains dietary fibre — good for digestion");
    if (sugar <= 5) good.push("Low sugar — safe for daily use");
    if (fat <= 3) good.push("Low fat — heart-friendly product");

    if (sugar > 22.5) concerns.push("High sugar — may cause blood sugar spikes");
    else if (sugar > 5) concerns.push("Moderate sugar — limit consumption");
    if (satFat > 5) concerns.push("High saturated fat — increases cholesterol");
    if (salt > 1.5) concerns.push("High salt — may increase blood pressure");

    let score = 100 - sugar * 1.5 - satFat * 2 - salt * 10 - fat * 0.8 + protein * 2;
    if (score < 0) score = 0;

    let grade = "F", color = "bg-red-600";
    if (score >= 85) { grade = "A"; color = "bg-green-600"; }
    else if (score >= 70) { grade = "B"; color = "bg-lime-500"; }
    else if (score >= 55) { grade = "C"; color = "bg-yellow-400"; }
    else if (score >= 40) { grade = "D"; color = "bg-orange-500"; }
    else { grade = "E"; color = "bg-red-500"; }

    setAnalysis({ good, concerns, score: Math.round(score), grade, color });
  }

  // -------------------------------
  // fetch product (India → global → demo)
  async function fetchProductData(code) {
    try {
      let res = await fetch(`https://in.openfoodfacts.org/api/v2/product/${code}`);
      let data = await res.json();
      if (!data || data.status === 0) {
        res = await fetch(`https://world.openfoodfacts.net/api/v2/product/${code}`);
        data = await res.json();
      }
      if (!data || data.status === 0) {
        return {
          product_name: "Nestlé KitKat (Demo)",
          brands: "Nestlé",
          quantity: "37 g",
          image_url: "https://m.media-amazon.com/images/I/61yBjs+HvoL._SL1500_.jpg",
          nutriments: {
            "energy-kcal_100g": 518,
            fat_100g: 26,
            "saturated-fat_100g": 14,
            carbohydrates_100g: 64,
            sugars_100g: 51,
            proteins_100g: 7,
            salt_100g: 0.2,
            fiber_100g: 0.5
          },
          ingredients_text:
            "Sugar, Wheat Flour, Cocoa Butter, Milk Solids, Cocoa Mass, Vegetable Fat, Emulsifier (Soy Lecithin), Salt, Yeast, Artificial Flavouring.",
          categories: "Chocolate bars, Snacks",
          labels: "Vegetarian",
        };
      }
      return data.product;
    } catch {
      throw new Error("fetch failed");
    }
  }

  // -------------------------------
  // search
  async function handleSearch(e) {
    e.preventDefault();
    setError(""); setProduct(null); setAnalysis(null);
    if (!barcode.trim()) return setError("Please enter a barcode.");
    setLoading(true);
    try {
      const data = await fetchProductData(barcode);
      setProduct(data);
      analyzeProduct(data.nutriments);
    } catch {
      setError("❌ Product not found in Indian or Global database.");
    } finally {
      setLoading(false);
    }
  }

  const colorFor = (v, low, med) =>
    v <= low ? "bg-green-100 text-green-800"
      : v <= med ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";

  // -------------------------------
  // ingredients renderer
  function renderIngredients(p) {
    if (!p) return null;
    if (Array.isArray(p.ingredients) && p.ingredients.length > 0) {
      return (
        <ul className="list-disc pl-5 text-sm text-gray-700">
          {p.ingredients.map((ing, i) => (
            <li key={i}>
              {ing.text || ing.name}
              {ing.percent && <span className="text-gray-500"> — {ing.percent}%</span>}
            </li>
          ))}
        </ul>
      );
    }
    if (p.ingredients_text) {
      return (
        <ul className="list-disc pl-5 text-sm text-gray-700">
          {p.ingredients_text.split(",").map((part, i) => (
            <li key={i}>{part.trim()}</li>
          ))}
        </ul>
      );
    }
    return <p className="text-sm text-gray-600">Ingredient details not available.</p>;
  }

  // -------------------------------
  // UI
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      {/* header */}
      <motion.div
        initial={{opacity:0,y:-20}}
        animate={{opacity:1,y:0}}
        transition={{duration:0.6}}
        className="w-full max-w-3xl text-center rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-6 shadow-lg mb-6"
      >
        <h1 className="text-3xl font-bold flex justify-center items-center gap-2">
          <HeartPulse className="w-7 h-7"/> Food Health Scanner
        </h1>
        <p className="opacity-90 text-sm">Barcode → Ingredients → 100g Nutrition → Health Score</p>
      </motion.div>

      {/* search */}
      <form onSubmit={handleSearch} className="flex w-full max-w-lg gap-2 mb-6">
        <input
          className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter barcode (e.g. 8901058816338)"
          value={barcode}
          onChange={(e)=>setBarcode(e.target.value)}
        />
        <button className="bg-indigo-600 text-white px-5 rounded-lg hover:bg-indigo-700">Search</button>
        <button
          type="button"
          onClick={()=>setBarcode("8901058816338")}
          className="bg-gray-200 text-gray-700 px-3 rounded-lg hover:bg-gray-300"
        >
          Demo
        </button>
      </form>

      {loading && <div className="text-gray-600 animate-pulse">Fetching product data...</div>}
      {error && <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-lg">{error}</div>}

      {product && (
        <motion.div
          initial={{opacity:0,scale:0.98}}
          animate={{opacity:1,scale:1}}
          transition={{duration:0.5}}
          className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6 mt-4"
        >
          {/* top */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img
              src={product.image_front_small_url || product.image_url || "https://via.placeholder.com/150"}
              alt={product.product_name}
              className="w-36 h-36 object-contain rounded-lg border bg-gray-50"
            />
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-800">{product.product_name}</h2>
              <p className="text-gray-600">{product.brands}</p>
              <p className="text-gray-600">{product.quantity}</p>
              {analysis && (
                <div className={`inline-block mt-3 px-4 py-2 rounded-lg text-white font-semibold ${analysis.color}`}>
                  Health Grade: {analysis.grade} ({analysis.score}/100)
                </div>
              )}
            </div>
          </div>

          {/* good/bad */}
          {analysis && (
            <div className="mt-8 grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-green-600"/><h3 className="text-green-700 font-semibold">👍 Good Aspects</h3>
                </div>
                <ul className="list-disc pl-5 text-gray-700 text-sm">
                  {analysis.good.length?analysis.good.map((g,i)=><li key={i}>{g}</li>):<li>No notable benefits.</li>}
                </ul>
              </div>
              <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-red-600"/><h3 className="text-red-700 font-semibold">⚠️ Concerns</h3>
                </div>
                <ul className="list-disc pl-5 text-gray-700 text-sm">
                  {analysis.concerns.length?analysis.concerns.map((c,i)=><li key={i}>{c}</li>):<li>No major concerns.</li>}
                </ul>
              </div>
            </div>
          )}

          {/* nutrient chips */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className={`p-2 rounded ${colorFor(n(product.nutriments,"sugars_100g"),5,22.5)}`}>
              Sugar: {n(product.nutriments,"sugars_100g")} g / 100g
            </div>
            <div className={`p-2 rounded ${colorFor(n(product.nutriments,"fat_100g"),3,17.5)}`}>
              Fat: {n(product.nutriments,"fat_100g")} g / 100g
            </div>
            <div className={`p-2 rounded ${colorFor(n(product.nutriments,"saturated-fat_100g"),1.5,5)}`}>
              Sat Fat: {n(product.nutriments,"saturated-fat_100g")} g / 100g
            </div>
            <div className={`p-2 rounded ${colorFor(n(product.nutriments,"salt_100g"),0.3,1.5)}`}>
              Salt: {n(product.nutriments,"salt_100g")} g / 100g
            </div>
            <div className="p-2 rounded bg-indigo-50 text-indigo-700">
              Protein: {n(product.nutriments,"proteins_100g")} g / 100g
            </div>
            <div className="p-2 rounded bg-gray-100 text-gray-800">
              Energy: {n(product.nutriments,"energy-kcal_100g")} kcal / 100g
            </div>
          </div>

          {/* 100g explanation */}
          <div className="mt-3 text-sm text-gray-700 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-3">
            <strong>Note:</strong> All nutrition values are measured per <strong>100 grams</strong> of product.
            This helps compare foods easily — for example, 20 g sugar/100 g = 20% sugar by weight.
          </div>

          {/* pie chart */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-indigo-700 text-center mb-3">
              🍽️ Nutrition Composition (per 100 g)
            </h3>
            <div className="flex justify-center">
              <PieChart width={300} height={260}>
                <Pie
                  dataKey="value"
                  data={[
                    { name:"Fat (g)", value:n(product.nutriments,"fat_100g") },
                    { name:"Sugars (g)", value:n(product.nutriments,"sugars_100g") },
                    { name:"Protein (g)", value:n(product.nutriments,"proteins_100g") },
                    { name:"Carbs (g)", value:n(product.nutriments,"carbohydrates_100g") },
                  ]}
                  cx="50%" cy="50%" outerRadius={90} label
                >
                  <Cell fill="#f87171"/><Cell fill="#facc15"/><Cell fill="#4ade80"/><Cell fill="#60a5fa"/>
                </Pie>
                <Tooltip/><Legend/>
              </PieChart>
            </div>
          </div>

          {/* ingredients */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
              <Info className="text-indigo-600"/> Ingredients
            </h3>
            <div className="mt-2">{renderIngredients(product)}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

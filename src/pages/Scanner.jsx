/* src/pages/Scanner.jsx */
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ScanLine, Camera, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { PieChart, Pie, Tooltip, Cell, Legend } from "recharts";

/* Scanner page with:
   - manual barcode input + image upload (ZXing)
   - OpenFoodFacts lookup
   - ingredient classification with explicit reasons
   - top row: Concern / Not Concern summary
   - right column: ingredients list with tag + reason
   - traffic-light bars + 100g explanation + health grade + chart
*/

export default function Scanner() {
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImg, setUploadedImg] = useState(null);
  const imgRef = useRef(null);
  const readerRef = useRef(null);

  const n = (o, k) => (o && Number(o[k])) || 0;

  const thresholds = {
    sugar: { green: 5, yellow: 22.5 },
    salt: { green: 0.3, yellow: 1.5 },
    satFat: { green: 1.5, yellow: 5 },
  };

  // ---- classification rules with reasons (badKeys prioritized)
  const badRules = [
    { key: "high fructose", reason: "Contains high-fructose sweeteners — linked to metabolic issues." },
    { key: "fructose", reason: "Added simple sugar — raises blood sugar and calories." },
    { key: "glucose", reason: "Added sugar — raises blood sugar quickly." },
    { key: "sugar", reason: "High in added sugar — increases calorie density and risk of diabetes." },
    { key: "syrup", reason: "Sugar syrup — concentrated sweetener (high calories)." },
    { key: "sucralose", reason: "Artificial sweetener — some users prefer avoiding artificial additives." },
    { key: "partially hydrogenated", reason: "Trans fats source — harmful for heart health." },
    { key: "hydrogenated", reason: "May contain trans or unhealthy fats — avoid long term." },
    { key: "palm oil", reason: "High in saturated fats and associated environmental concerns." },
    { key: "trans fat", reason: "Trans fats increase bad cholesterol and heart disease risk." },
    { key: "monosodium", reason: "Contains MSG — some people are sensitive to it." },
    { key: "salt", reason: "High sodium can increase blood pressure if consumed often." },
    { key: "sodium", reason: "High sodium can increase blood pressure." },
    { key: "preservative", reason: "Contains preservatives — may be undesirable for clean label fans." },
    { key: "colour", reason: "Artificial colours — no nutritional benefit, some concern for sensitivity." },
    { key: "artificial flavour", reason: "Artificial flavours — not a natural ingredient." },
    { key: "emulsifier", reason: "Some emulsifiers are processed additives; check specifics if sensitive." },
    { key: "e-", reason: "Contains additive codes (E-numbers) — these are processed additives." },
  ];

  const goodRules = [
    { key: "whole", reason: "Whole ingredient — more fibre and nutrients." },
    { key: "wholegrain", reason: "Whole grain — source of fibre and slower carbs." },
    { key: "oat", reason: "Oats — good source of soluble fibre." },
    { key: "millet", reason: "Millet — whole grain, nutrient-dense." },
    { key: "lentil", reason: "Lentil — plant protein and fibre." },
    { key: "pea", reason: "Pea — plant protein and fibre." },
    { key: "almond", reason: "Almond — healthy fats and protein." },
    { key: "walnut", reason: "Walnut — source of healthy fats." },
    { key: "protein", reason: "Good source of protein." },
    { key: "fiber", reason: "Contains fibre — supports digestion." },
    { key: "chia", reason: "Chia — omega-3 and fibre." },
    { key: "flax", reason: "Flax — fibre and healthy fats." },
  ];

  // classify each ingredient text -> {text, tag, reason}
  function classifyIngredients(productObj) {
    const rawList =
      Array.isArray(productObj.ingredients) && productObj.ingredients.length > 0
        ? productObj.ingredients.map((ing) => (ing && (ing.text || ing.name)) || "")
        : (productObj.ingredients_text || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

    const items = rawList.map((ing) => {
      const low = ing.toLowerCase();
      // check bad rules first
      for (const r of badRules) {
        if (low.includes(r.key)) return { text: ing, tag: "bad", reason: r.reason };
      }
      // then good rules
      for (const g of goodRules) {
        if (low.includes(g.key)) return { text: ing, tag: "good", reason: g.reason };
      }
      // neutral fallback
      return { text: ing, tag: "neutral", reason: "No specific concern detected; neutral ingredient." };
    });

    return items;
  }

  // build summary boxes (unique reasons + examples)
  function buildSummaries(classified) {
    const concernMap = new Map();
    const okMap = new Map();

    classified.forEach((it) => {
      if (it.tag === "bad") {
        // group by reason
        const key = it.reason;
        const arr = concernMap.get(key) || [];
        arr.push(it.text);
        concernMap.set(key, arr);
      } else if (it.tag === "good") {
        const key = it.reason;
        const arr = okMap.get(key) || [];
        arr.push(it.text);
        okMap.set(key, arr);
      }
    });

    const concerns = Array.from(concernMap.entries()).map(([reason, examples]) => ({
      reason,
      examples: examples.slice(0, 3),
    }));
    const notConcerns = Array.from(okMap.entries()).map(([reason, examples]) => ({
      reason,
      examples: examples.slice(0, 3),
    }));

    return { concerns, notConcerns };
  }

  // standard grade computation
  function computeGrade(nutri = {}) {
    const sugar = n(nutri, "sugars_100g");
    const fat = n(nutri, "fat_100g");
    const sat = n(nutri, "saturated-fat_100g");
    const salt = n(nutri, "salt_100g");
    const protein = n(nutri, "proteins_100g");
    const fiber = n(nutri, "fiber_100g");

    let score = 100 - sugar * 1.5 - sat * 2 - salt * 8 - fat * 0.8 + protein * 1.5 + fiber * 1.2;
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    let grade = "F",
      color = "bg-red-600";
    if (score >= 85) {
      grade = "A";
      color = "bg-green-600";
    } else if (score >= 70) {
      grade = "B";
      color = "bg-lime-500";
    } else if (score >= 55) {
      grade = "C";
      color = "bg-yellow-400";
    } else if (score >= 40) {
      grade = "D";
      color = "bg-orange-500";
    } else {
      grade = "E";
      color = "bg-red-500";
    }

    return { score: Math.round(score), grade, color, sugar, fat, sat, salt, protein, fiber };
  }

  // per 100g explanation
  function per100gExplanation(nutri = {}) {
    const sugar = n(nutri, "sugars_100g");
    const fat = n(nutri, "fat_100g");
    const sat = n(nutri, "saturated-fat_100g");
    const salt = n(nutri, "salt_100g");
    const protein = n(nutri, "proteins_100g");
    const carbs = n(nutri, "carbohydrates_100g");
    const energy = n(nutri, "energy-kcal_100g");
    const fiber = n(nutri, "fiber_100g");
    return { sugar, fat, sat, salt, protein, carbs, energy, fiber };
  }

  async function fetchProduct(code) {
    try {
      let res = await fetch(`https://in.openfoodfacts.org/api/v2/product/${code}`);
      let data = await res.json();
      if (!data || data.status === 0) {
        res = await fetch(`https://world.openfoodfacts.net/api/v2/product/${code}`);
        data = await res.json();
      }
      if (!data || data.status === 0) return null;
      return data.product;
    } catch {
      return null;
    }
  }

  // main manual search
  async function handleSearch(e) {
    e?.preventDefault();
    setError("");
    setProduct(null);
    setAnalysis(null);

    if (!barcode || barcode.trim().length < 6) {
      setError("Enter a valid barcode or upload an image.");
      return;
    }
    setLoading(true);
    const p = await fetchProduct(barcode.trim());
    setLoading(false);
    if (!p) {
      setError("Product not found in OpenFoodFacts.");
      return;
    }
    const grade = computeGrade(p.nutriments || {});
    const classified = classifyIngredients(p);
    const expl = per100gExplanation(p.nutriments || {});
    const summaries = buildSummaries(classified);

    setProduct(p);
    setAnalysis({ grade, classified, expl, summaries });
  }

  // demo loader
  async function loadDemo() {
    setBarcode("8901058816338");
    setError("");
    setLoading(true);
    const p = await fetchProduct("8901058816338");
    setLoading(false);
    if (!p) {
      // fallback demo data if OFF missing
      const fallback = {
        product_name: "Demo Chocolate Bar",
        brands: "DemoBrand",
        quantity: "37 g",
        image_url: "https://via.placeholder.com/200",
        ingredients_text: "Sugar, Wheat Flour, Cocoa Butter, Milk Solids, Cocoa Mass, Vegetable Fat, Emulsifier (Soy Lecithin), Salt",
        nutriments: {
          sugars_100g: 51,
          fat_100g: 26,
          "saturated-fat_100g": 14,
          salt_100g: 0.2,
          proteins_100g: 7,
          carbohydrates_100g: 64,
          "energy-kcal_100g": 518,
          fiber_100g: 1,
        },
      };
      const grade = computeGrade(fallback.nutriments);
      const classified = classifyIngredients(fallback);
      const expl = per100gExplanation(fallback.nutriments);
      const summaries = buildSummaries(classified);
      setProduct(fallback);
      setAnalysis({ grade, classified, expl, summaries });
    } else {
      const grade = computeGrade(p.nutriments || {});
      const classified = classifyIngredients(p);
      const expl = per100gExplanation(p.nutriments || {});
      const summaries = buildSummaries(classified);
      setProduct(p);
      setAnalysis({ grade, classified, expl, summaries });
    }
  }

  // image upload + decode using ZXing new API
  async function handleImageUpload(e) {
    setError("");
    setProduct(null);
    setAnalysis(null);
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImg(url);

    try {
      if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
      const imgEl = document.getElementById("zxing-image");
      if (!imgEl) {
        setError("Internal: image element missing.");
        return;
      }
      imgEl.src = url;
      await new Promise((res, rej) => {
        imgEl.onload = () => res(true);
        imgEl.onerror = () => rej(new Error("image load failed"));
      });

      const result = await readerRef.current.decodeFromImage("zxing-image");
      if (result && result.text) {
        setBarcode(result.text);
        setLoading(true);
        const p = await fetchProduct(result.text);
        setLoading(false);
        if (!p) {
          setError("Barcode decoded but product not found in OpenFoodFacts.");
          return;
        }
        const grade = computeGrade(p.nutriments || {});
        const classified = classifyIngredients(p);
        const expl = per100gExplanation(p.nutriments || {});
        const summaries = buildSummaries(classified);
        setProduct(p);
        setAnalysis({ grade, classified, expl, summaries });
      } else {
        setError("Could not decode barcode from this image.");
      }
    } catch (err) {
      console.warn(err);
      setError("Failed to decode barcode from image. Try a clearer photo or rotate it.");
    }
  }

  // pie data
  function pieDataFromN(nutri = {}) {
    const fat = n(nutri, "fat_100g");
    const sugars = n(nutri, "sugars_100g");
    const protein = n(nutri, "proteins_100g");
    const carbs = n(nutri, "carbohydrates_100g");
    return [
      { name: "Fat (g)", value: fat || 0 },
      { name: "Sugars (g)", value: sugars || 0 },
      { name: "Protein (g)", value: protein || 0 },
      { name: "Carbs (g)", value: carbs || 0 },
    ];
  }

  const fmtG = (v) => (v || 0).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-5xl mx-auto">
        {/* HERO / SEARCH */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-md border border-white/20 p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-brand-700 flex items-center gap-3">
                <ScanLine className="text-brand-600" /> Food Scanner
              </h1>
              <p className="text-sm text-gray-600 mt-1">Enter barcode number or upload a barcode photo. Results come from OpenFoodFacts.</p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={loadDemo} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Demo</button>
            </div>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="mt-5 grid grid-cols-1 md:grid-cols-[1fr,200px,160px] gap-3">
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter barcode (e.g. 8901058816338)"
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-600 outline-none"
            />
            <button type="submit" className="px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Search</button>
            <label className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer hover:bg-gray-50 justify-center">
              <Camera className="w-5 h-5 text-gray-700" />
              <span className="text-sm text-gray-700">Upload / Photo</span>
              <input id="upload-file" accept="image/*" onChange={handleImageUpload} type="file" className="hidden" />
            </label>
          </form>

          {loading && <div className="mt-4 text-gray-600">Fetching product details...</div>}
          {error && <div className="mt-4 text-red-600">{error}</div>}
        </div>

        <img id="zxing-image" ref={imgRef} alt="barcode-preview" src={uploadedImg || ""} className="hidden" />

        {/* PRODUCT CARD */}
        {product && analysis && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mt-6">
            <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-white/20 p-6 shadow-xl">
              {/* header row */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <img src={product.image_front_small_url || product.image_url || "https://via.placeholder.com/200"} alt={product.product_name} className="w-40 h-40 object-contain rounded-xl border bg-gray-50" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">{product.product_name}</h2>
                  <p className="text-gray-600">{product.brands} • {product.quantity}</p>

                  <div className="mt-3">
                    <span className={`inline-block text-white px-3 py-2 rounded-full font-semibold ${analysis.grade.color}`}>
                      Grade: {analysis.grade.grade} • {analysis.grade.score}/100
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Energy</div>
                      <div className="font-semibold">{fmtG(n(product.nutriments, "energy-kcal_100g"))} kcal /100g</div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Protein</div>
                      <div className="font-semibold">{fmtG(n(product.nutriments, "proteins_100g"))} g /100g</div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Fiber</div>
                      <div className="font-semibold">{fmtG(n(product.nutriments, "fiber_100g"))} g /100g</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* NEW: Upper summary + ingredients layout */}
              <div className="mt-6 grid md:grid-cols-[1fr,1fr,1.6fr] gap-4">
                {/* LEFT: What should be concerned */}
                <div className="p-4 rounded-xl bg-red-50 border-l-4 border-red-400">
                  <h4 className="text-red-700 font-semibold mb-2">What to be concerned</h4>
                  {analysis.summaries.concerns.length > 0 ? (
                    <ul className="text-sm list-disc pl-5 space-y-2 text-gray-700">
                      {analysis.summaries.concerns.map((c, i) => (
                        <li key={i}>
                          <div className="font-medium">{c.reason}</div>
                          <div className="text-xs text-gray-500">Examples: {c.examples.join(", ")}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-700">No specific concerns detected.</div>
                  )}
                </div>

                {/* CENTER: What is NOT a concern */}
                <div className="p-4 rounded-xl bg-green-50 border-l-4 border-green-400">
                  <h4 className="text-green-700 font-semibold mb-2">Not a concern (beneficial)</h4>
                  {analysis.summaries.notConcerns.length > 0 ? (
                    <ul className="text-sm list-disc pl-5 space-y-2 text-gray-700">
                      {analysis.summaries.notConcerns.map((c, i) => (
                        <li key={i}>
                          <div className="font-medium">{c.reason}</div>
                          <div className="text-xs text-gray-500">Examples: {c.examples.join(", ")}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-700">No clear beneficial ingredients detected.</div>
                  )}
                </div>

                {/* RIGHT: Full ingredients with tag + reason */}
                <div className="p-4 rounded-xl bg-white border shadow-sm">
                  <h4 className="text-gray-800 font-semibold mb-3">Ingredients (with reason)</h4>
                  {analysis.classified.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {analysis.classified.map((it, idx) => (
                        <li key={idx} className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-gray-800">{it.text}</div>
                            <div className="text-xs text-gray-500 mt-1">{it.reason}</div>
                          </div>
                          <div className="shrink-0">
                            {it.tag === "good" && <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">Good</span>}
                            {it.tag === "bad" && <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">Concern</span>}
                            {it.tag === "neutral" && <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">Neutral</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-600">No ingredient data available.</div>
                  )}
                </div>
              </div>

              {/* per 100g explanation */}
              <div className="mt-6 p-4 rounded-lg bg-blue-50 border-l-4 border-blue-400 text-sm text-gray-700">
                <strong>Per 100 g explanation:</strong> All nutrient numbers shown are per <strong>100 g</strong> of product — this allows fair comparison (e.g. 20 g sugar / 100 g = 20% sugar by weight).
              </div>

              {/* traffic-light bars */}
              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Sugar</div>
                    <div className="text-sm text-gray-600">{fmtG(analysis.grade.sugar)} g /100g</div>
                  </div>
                  <TrafficBar value={analysis.grade.sugar} kind="sugar" thresholds={thresholds} />
                </div>

                <div className="p-4 rounded-xl bg-white border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Salt</div>
                    <div className="text-sm text-gray-600">{fmtG(analysis.grade.salt)} g /100g</div>
                  </div>
                  <TrafficBar value={analysis.grade.salt} kind="salt" thresholds={thresholds} />
                </div>

                <div className="p-4 rounded-xl bg-white border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Saturated Fat</div>
                    <div className="text-sm text-gray-600">{fmtG(analysis.grade.sat)} g /100g</div>
                  </div>
                  <TrafficBar value={analysis.grade.sat} kind="satFat" thresholds={thresholds} />
                </div>
              </div>

              {/* chart + other details */}
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div className="rounded-xl p-4 bg-white border shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Nutrition composition (per 100 g)</h4>
                  <div className="flex justify-center">
                    <PieChart width={260} height={220}>
                      <Pie dataKey="value" outerRadius={70} data={pieDataFromN(product.nutriments)} label>
                        <Cell fill="#f87171" />
                        <Cell fill="#facc15" />
                        <Cell fill="#4ade80" />
                        <Cell fill="#60a5fa" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">Values are grams per 100 g. Use this when comparing similar products.</div>
                </div>

                <div className="rounded-xl p-4 bg-white border shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">More details</h4>
                  <div className="text-sm text-gray-700">
                    <div><strong>Brand:</strong> {product.brands || "—"}</div>
                    <div className="mt-2"><strong>Categories:</strong> {product.categories || "—"}</div>
                    <div className="mt-2"><strong>Labels:</strong> {product.labels || "—"}</div>
                    <div className="mt-2"><strong>Ingredients text:</strong> {product.ingredients_text || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </motion.div>
    </div>
  );
}

/* TrafficBar component */
function TrafficBar({ value = 0, kind = "sugar", thresholds }) {
  const t = thresholds[kind];
  const pct = Math.min((value / (t.yellow * 1.5 || 1)) * 100, 100);
  const status = value <= t.green ? "good" : value <= t.yellow ? "moderate" : "bad";
  const color = status === "good" ? "bg-green-500" : status === "moderate" ? "bg-yellow-400" : "bg-red-500";
  const text = status === "good" ? "Low" : status === "moderate" ? "Moderate" : "High";

  return (
    <div className="mt-3">
      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
        <div className={`${color} h-3`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
        <div>{text}</div>
        <div>{fmtSmall(value)} g /100g</div>
      </div>
    </div>
  );
}

function fmtSmall(v) {
  return (v || 0).toFixed(1);
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Utensils, Scale, Plus, Trash2, Check, X, Sparkles, AlertCircle } from "lucide-react";
import CircularProgressBar from "./CircularProgressBar";
import confetti from "canvas-confetti";
import { playBubbleSound, playClickSound, playSuccessSound, playSparkleSound } from "@/lib/sound";

interface MealLog {
  id?: string;
  meal_name: string;
  portion: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quality_summary: string;
  created_at?: string;
  fiber?: number;
}

interface MealLoggerProps {
  tdeeTarget: number; // Daily budget
  onMealAdded?: () => void;
}

export default function MealLogger({ tdeeTarget, onMealAdded }: MealLoggerProps) {
  const [smartInput, setSmartInput] = useState("");
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // AI parsed result preview state
  const [aiPreview, setAiPreview] = useState<{
    meal_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    quality_summary: string;
  } | null>(null);

  // Fetch today's meal logs
  useEffect(() => {
    const fetchTodayMeals = async () => {
      let userId = "guest";
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user || null;
        if (user) {
          userId = user.id;
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);

          const { data: dbData, error } = await supabase
            .from("meal_logs")
            .select("*")
            .eq("user_id", user.id)
            .gte("created_at", startOfToday.toISOString())
            .order("created_at", { ascending: true });

          if (!error && dbData) {
            setMeals(dbData);
            setFetching(false);
            return;
          }
        }
      } catch (err) {
        console.error("Error fetching meals:", err);
      }

      // Fallback/Guest loading from local storage
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const localMealsRaw = localStorage.getItem(`meals_${userId}`);
      if (localMealsRaw) {
        const mealsList = JSON.parse(localMealsRaw) as MealLog[];
        const todayMeals = mealsList.filter(m => {
          const date = new Date(m.created_at || new Date());
          return date >= startOfToday;
        });
        setMeals(todayMeals);
      } else {
        setMeals([]);
      }
      setFetching(false);
    };

    fetchTodayMeals();
  }, []);

  // Analyze natural language input via Next.js API Route
  const handleAnalyze = async (e?: React.FormEvent, textToUse?: string) => {
    if (e) e.preventDefault();
    const query = (textToUse || smartInput).trim();
    if (!query) return;

    setLoading(true);
    setAiPreview(null);
    playClickSound();

    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: query }),
      });

      if (!res.ok) {
        throw new Error("ระบบวิเคราะห์ขัดข้องชั่วคราว ลองใหม่อีกครั้งนะคะ 🥺");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAiPreview({
        meal_name: data.meal_name || query,
        calories: data.calories || 200,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        fiber: data.fiber || 0,
        quality_summary: data.quality_summary || "วิเคราะห์โภชนาการเรียบร้อยแล้วค่ะ 🐰✨"
      });
      
      playSparkleSound();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "เกิดข้อผิดพลาดในการวิเคราะห์สารอาหาร");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!aiPreview) return;
    setLoading(true);

    try {
      let userId = "guest";
      let user = null;
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user || null;
      } catch {
        // Offline or auth error
      }

      if (user) {
        userId = user.id;
      }

      const newMealPayload = {
        user_id: userId,
        meal_name: aiPreview.meal_name,
        portion: 1, // Smart input calculates absolute portions automatically
        calories: aiPreview.calories,
        protein: aiPreview.protein,
        carbs: aiPreview.carbs,
        fat: aiPreview.fat,
        quality_summary: aiPreview.quality_summary,
        created_at: new Date().toISOString()
      };

      let loggedMeal = null;

      if (user) {
        try {
          const { data, error } = await supabase
            .from("meal_logs")
            .insert(newMealPayload)
            .select();

          if (error) throw error;
          if (data && data[0]) {
            loggedMeal = {
              ...data[0],
              fiber: aiPreview.fiber // Keep fiber locally
            };
          }
        } catch (dbErr) {
          console.warn("Supabase insert failed. If 'fiber' column is not added, we save it locally:", dbErr);
        }
      }

      if (!loggedMeal) {
        loggedMeal = {
          ...newMealPayload,
          id: "local_" + Date.now(),
          fiber: aiPreview.fiber
        };
      }

      // Save to local storage array
      const localMealsKey = `meals_${userId}`;
      const localMealsRaw = localStorage.getItem(localMealsKey);
      const mealsArray = localMealsRaw ? JSON.parse(localMealsRaw) : [];
      mealsArray.push(loggedMeal);
      localStorage.setItem(localMealsKey, JSON.stringify(mealsArray));

      // Update state
      setMeals((prev) => [...prev, loggedMeal]);
      
      // Play sound and confetti
      playSuccessSound();
      confetti({ particleCount: 35, spread: 45, colors: ["#64b5f6", "#a5d6a7", "#ffebee"] });

      setSmartInput("");
      setAiPreview(null);
      
      if (onMealAdded) onMealAdded();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "เกิดข้อผิดพลาดในการบันทึกอาหาร");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPreview = () => {
    setAiPreview(null);
    playClickSound();
  };

  const handleDeleteMeal = async (id: string) => {
    let userId = "guest";
    try {
      let user = null;
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user || null;
      } catch {
        // Offline or auth error
      }

      if (user) {
        userId = user.id;
        if (!id.startsWith("local_")) {
          const { error } = await supabase
            .from("meal_logs")
            .delete()
            .eq("id", id);
          if (error) console.warn("Supabase delete failed, but removing from local cache.");
        }
      }
    } catch (dbErr) {
      console.warn("Supabase delete failed, falling back to local cache:", dbErr);
    }

    // Always remove from local state and storage cache
    setMeals((prev) => prev.filter(m => m.id !== id));
    try {
      const localMealsKey = `meals_${userId}`;
      const localMealsRaw = localStorage.getItem(localMealsKey);
      if (localMealsRaw) {
        const mealsArray = JSON.parse(localMealsRaw) as MealLog[];
        const filteredArray = mealsArray.filter(m => m.id !== id);
        localStorage.setItem(localMealsKey, JSON.stringify(filteredArray));
      }
    } catch (err) {
      console.error(err);
    }
    
    if (onMealAdded) onMealAdded();
  };

  // Quick Adds Helper with quantity specified
  const quickAdds = [
    { label: "ไข่ต้ม 2 ฟอง", value: "ไข่ต้ม 2 ฟอง" },
    { label: "กล้วยน้ำว้า 1 ลูก", value: "กล้วยน้ำว้า 1 ลูก" },
    { label: "สลัดอกไก่ 1 จาน", value: "สลัดอกไก่ 1 จาน" },
    { label: "ส้มตำไทย 1 จาน", value: "ส้มตำไทย 1 จาน" },
    { label: "ชาไข่มุก 1 แก้ว", value: "ชาไข่มุก 1 แก้ว" },
    { label: "กาแฟดำ 1 ถ้ว", value: "กาแฟดำ 1 ถ้วย" }
  ];

  // Daily totals
  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFat = meals.reduce((acc, m) => acc + m.fat, 0);
  const totalFiber = meals.reduce((acc, m) => acc + (m.fiber || 0), 0);

  const budget = tdeeTarget || 2000;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none pb-24 animate-fade-in">
      {/* Logger Input Form */}
      <div className="lg:col-span-7 bg-white border-4 border-healthy-green-light rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300">
        <h2 className="text-2xl font-black text-healthy-green-dark mb-6 flex items-center gap-2">
          <span>🍽️ บันทึกการกินวันนี้</span>
          <span className="text-xs bg-healthy-green-light px-2.5 py-0.5 rounded-full border border-healthy-green-medium/20 text-healthy-green-dark">AI Smart Input</span>
        </h2>

        {/* Dynamic State Layout */}
        {!aiPreview ? (
          /* Smart input text field */
          <form onSubmit={handleAnalyze} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-healthy-green-dark/80 mb-2 pl-2">
                พิมพ์สิ่งที่คุณทานในมื้อนี้ 🐰 (ระบุชื่ออาหารและปริมาณ)
              </label>
              <div className="relative">
                <textarea
                  required
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                  placeholder="เช่น 'ข้าวมันไก่ 1 จาน และไข่ต้ม 2 ฟอง' หรือ 'นมจืด 1 กล่องกับกล้วยหอม 1 ลูก'"
                  rows={3}
                  className="w-full p-4 bg-soft-cream-light border-2 border-soft-cream-dark rounded-2xl focus:border-healthy-green-primary focus:ring-0 focus:outline-none text-healthy-green-dark font-semibold transition-colors placeholder:text-healthy-green-dark/30 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !smartInput.trim()}
              className="w-full py-4 bg-healthy-green-primary hover:bg-healthy-green-dark text-white rounded-2xl font-bold shadow-lg shadow-healthy-green-primary/10 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังวิเคราะห์สารอาหารด้วย AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-white" />
                  <span>วิเคราะห์มื้ออาหารด้วย AI ✨</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Preview Card for user confirmation */
          <div className="space-y-5 bg-soft-cream-base border-3 border-healthy-green-medium/40 p-5 sm:p-6 rounded-3xl relative overflow-hidden animate-wiggle-once">
            <div className="absolute top-0 right-0 bg-healthy-green-primary text-white text-[10px] font-black px-3 py-1 rounded-bl-2xl flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-white" />
              <span>ผลการวิเคราะห์โดย AI</span>
            </div>

            <h3 className="text-lg font-black text-healthy-green-dark">
              🍴 ยืนยันการบันทึกอาหารมื้อนี้
            </h3>

            <div className="bg-white border-2 border-soft-cream-dark rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-center border-b border-soft-cream-dark pb-2">
                <span className="text-xs font-bold text-healthy-green-dark/60">เมนูอาหาร</span>
                <span className="text-base font-extrabold text-healthy-green-dark">{aiPreview.meal_name}</span>
              </div>

              {/* Nutrients Grid layout */}
              <div className="grid grid-cols-5 gap-1.5 text-center pt-1">
                <div className="bg-kawaii-pink-light border border-kawaii-pink-primary/20 rounded-xl p-1.5">
                  <span className="block text-[8px] font-black text-kawaii-pink-dark">แคลอรี่</span>
                  <span className="text-xs font-black text-kawaii-pink-dark">{aiPreview.calories} kcal</span>
                </div>
                <div className="bg-[#e3f2fd] border border-blue-200 rounded-xl p-1.5">
                  <span className="block text-[8px] font-black text-blue-700">โปรตีน</span>
                  <span className="text-xs font-black text-blue-900">{aiPreview.protein}g</span>
                </div>
                <div className="bg-butter-yellow-light border border-butter-yellow-primary/30 rounded-xl p-1.5">
                  <span className="block text-[8px] font-black text-butter-yellow-dark">คาร์บ</span>
                  <span className="text-xs font-black text-healthy-green-dark">{aiPreview.carbs}g</span>
                </div>
                <div className="bg-[#efebe9] border border-[#d7ccc8] rounded-xl p-1.5">
                  <span className="block text-[8px] font-black text-[#5d4037]">ไขมัน</span>
                  <span className="text-xs font-black text-[#3e2723]">{aiPreview.fat}g</span>
                </div>
                <div className="bg-[#e8f5e9] border border-healthy-green-medium/20 rounded-xl p-1.5">
                  <span className="block text-[8px] font-black text-healthy-green-dark">ใยอาหาร</span>
                  <span className="text-xs font-black text-healthy-green-dark">{aiPreview.fiber}g</span>
                </div>
              </div>

              {/* AI bubble advice */}
              <div className="bg-soft-cream-light border border-soft-cream-dark p-3 rounded-xl text-xs font-semibold text-healthy-green-dark/80 italic">
                🎀 {aiPreview.quality_summary}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleConfirmSave}
                disabled={loading}
                className="py-3.5 bg-healthy-green-primary hover:bg-healthy-green-dark text-white rounded-2xl font-bold shadow-lg shadow-healthy-green-primary/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-5 h-5" />
                <span>ยืนยันการบันทึก ✨</span>
              </button>
              <button
                onClick={handleCancelPreview}
                disabled={loading}
                className="py-3.5 bg-white border-2 border-kawaii-pink-primary/30 hover:border-kawaii-pink-primary text-kawaii-pink-primary rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-5 h-5" />
                <span>ยกเลิก ❌</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Add Section */}
        {!aiPreview && (
          <div className="mt-8 border-t border-soft-cream-dark pt-6">
            <span className="block text-sm font-bold text-healthy-green-dark/60 mb-3 pl-1">
              เมนูลัดด่วนวิเคราะห์ทันที (Quick AI Analyze)
            </span>
            <div className="flex flex-wrap gap-2">
              {quickAdds.map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    setSmartInput(item.value);
                    handleAnalyze(undefined, item.value);
                  }}
                  disabled={loading}
                  className="px-3 py-2 bg-soft-cream-light border-2 border-soft-cream-dark hover:border-healthy-green-primary hover:bg-healthy-green-light text-healthy-green-dark rounded-2xl font-bold text-xs transition-all transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  🐰 {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats and Circular Progress */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border-4 border-healthy-green-light rounded-3xl p-6 shadow-sm flex flex-col items-center">
          <h3 className="text-lg font-black text-healthy-green-dark mb-2 text-center w-full">
            สัดส่วนแคลอรี่ประจำวัน
          </h3>
          <CircularProgressBar value={totalCalories} target={budget} />

          {/* Macro Breakdown */}
          <div className="grid grid-cols-4 gap-1.5 w-full mt-4 text-center">
            <div className="bg-[#e3f2fd] border border-[#bbdefb] rounded-2xl p-2">
              <span className="block text-[8px] font-black text-blue-800 leading-none">โปรตีน (P)</span>
              <span className="text-xs font-black text-blue-950 block mt-1">{totalProtein.toFixed(1)}g</span>
            </div>
            <div className="bg-butter-yellow-light border border-butter-yellow-primary/30 rounded-2xl p-2">
              <span className="block text-[8px] font-black text-butter-yellow-dark leading-none">คาร์บ (C)</span>
              <span className="text-xs font-black text-healthy-green-dark block mt-1">{totalCarbs.toFixed(1)}g</span>
            </div>
            <div className="bg-kawaii-pink-light border border-kawaii-pink-primary/30 rounded-2xl p-2">
              <span className="block text-[8px] font-black text-kawaii-pink-dark leading-none">ไขมัน (F)</span>
              <span className="text-xs font-black text-kawaii-pink-dark block mt-1">{totalFat.toFixed(1)}g</span>
            </div>
            <div className="bg-healthy-green-light border border-healthy-green-medium/20 rounded-2xl p-2">
              <span className="block text-[8px] font-black text-healthy-green-dark leading-none">ใยอาหาร</span>
              <span className="text-xs font-black text-healthy-green-dark block mt-1">{totalFiber.toFixed(1)}g</span>
            </div>
          </div>
        </div>

        {/* Meal Log List */}
        <div className="bg-white border-4 border-healthy-green-light rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-black text-healthy-green-dark mb-4">
            มื้ออาหารที่บันทึกแล้ว ({meals.length})
          </h3>

          {fetching ? (
            <div className="flex justify-center py-6">
              <span className="w-6 h-6 border-2 border-healthy-green-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : meals.length === 0 ? (
            <div className="text-center py-8 text-healthy-green-dark/40 font-bold text-sm">
              ยังไม่มีการบันทึกอาหารในวันนี้เลยค่ะ 🐰
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="bg-soft-cream-base border border-soft-cream-dark p-3.5 rounded-2xl relative transition-all hover:border-healthy-green-medium/40"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="font-extrabold text-healthy-green-dark text-sm block">
                        {meal.meal_name}
                      </span>
                      <span className="text-[10px] text-healthy-green-primary font-bold block mt-0.5">
                        🔥 {meal.calories} kcal | P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g {meal.fiber !== undefined ? `| Fiber:${meal.fiber}g` : ""}
                      </span>
                      {meal.quality_summary && (
                        <p className="text-xs text-healthy-green-dark/70 font-semibold mt-1.5 bg-white/50 px-2 py-1 rounded-lg border border-soft-cream-dark/50">
                          🎀 {meal.quality_summary}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => meal.id && handleDeleteMeal(meal.id)}
                      className="p-1.5 text-kawaii-pink-primary hover:text-kawaii-pink-dark rounded-xl hover:bg-kawaii-pink-light cursor-pointer shrink-0 transition-colors"
                      title="ลบเมนูนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

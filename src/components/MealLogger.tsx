"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Utensils, Scale, Plus, Trash2 } from "lucide-react";
import CircularProgressBar from "./CircularProgressBar";
import confetti from "canvas-confetti";
import { playBubbleSound, playClickSound, playSuccessSound } from "@/lib/sound";

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
}

interface MealLoggerProps {
  tdeeTarget: number; // Daily budget
  onMealAdded?: () => void;
}

// Predefined nutritional database for matching
const FOOD_DATABASE: Record<string, Omit<MealLog, "portion">> = {
  "สลัดอกไก่": {
    meal_name: "สลัดอกไก่",
    calories: 220,
    protein: 25,
    carbs: 8,
    fat: 6,
    quality_summary: "มื้อนี้มีวิตามินสูงและโปรตีนจากอกไก่ชั้นยอดเลยค่ะ! 🥦🐔",
  },
  "ข้าวมันไก่": {
    meal_name: "ข้าวมันไก่",
    calories: 590,
    protein: 18,
    carbs: 75,
    fat: 22,
    quality_summary: "คาร์บและไขมันอิ่มตัวค่อนข้างสูงน้า จิบน้ำมะนาวช่วยลดความเลี่ยนและช่วยย่อยนะคะ 🍋",
  },
  "แกงจืดเต้าหู้หมูสับ": {
    meal_name: "แกงจืดเต้าหู้หมูสับ",
    calories: 140,
    protein: 10,
    carbs: 6,
    fat: 5,
    quality_summary: "แคลอรี่ต่ำและอบอุ่นท้องดีมากค่ะ! ได้โปรตีนจากเต้าหู้และหมูสับแบบพอดีคำ 🍲",
  },
  "ส้มตำไทย": {
    meal_name: "ส้มตำไทย",
    calories: 120,
    protein: 3,
    carbs: 24,
    fat: 1,
    quality_summary: "มื้อนี้แคลอรี่ต่ำ วิตามินสูงมาก แต่ระวังโซเดียมหน่อยนะคะ จิบน้ำเปล่าตามเยอะๆ น้า 🥤",
  },
  "ชาไข่มุก": {
    meal_name: "ชาไข่มุก",
    calories: 360,
    protein: 2,
    carbs: 65,
    fat: 11,
    quality_summary: "อุ๊ย! ชาไข่มุกแก้วนี้มีน้ำตาลสูงไปหน่อยนะ วันนี้ต้องคุมอาหารหมวดแป้งดีๆ นะคะ 🥺🍬",
  },
  "กะเพราหมูสับไข่ดาว": {
    meal_name: "กะเพราหมูสับไข่ดาว",
    calories: 580,
    protein: 24,
    carbs: 68,
    fat: 24,
    quality_summary: "โปรตีนเด่น แต่อร่อยคู่โซเดียมและน้ำมันค่อนข้างเยอะ ดื่มน้ำเปล่าเพิ่มอีกนิดนะคะ 🥤",
  },
  "กล้วยน้ำว้า": {
    meal_name: "กล้วยน้ำว้า",
    calories: 90,
    protein: 1,
    carbs: 23,
    fat: 0,
    quality_summary: "พลังงานสะอาดรสหวานธรรมชาติ โพแทสเซียมสูง เหมาะเป็นของว่างรองท้องที่สุดค่ะ 🍌",
  },
  "ไข่ต้ม": {
    meal_name: "ไข่ต้ม",
    calories: 75,
    protein: 6.5,
    carbs: 0.6,
    fat: 5,
    quality_summary: "สุดยอดแหล่งโปรตีนบริสุทธิ์! ทานง่าย พลังงานต่ำ ดีต่อใจและสุขภาพสุดๆ ค่ะ 🥚",
  },
  "กาแฟดำ": {
    meal_name: "กาแฟดำ",
    calories: 5,
    protein: 0,
    carbs: 1,
    fat: 0,
    quality_summary: "แคลอรี่เกือบศูนย์! ช่วยกระตุ้นระบบเผาผลาญและความสดชื่นได้ดีเยี่ยมค่ะ ☕",
  },
  "สเต็กอกไก่": {
    meal_name: "สเต็กอกไก่",
    calories: 200,
    protein: 30,
    carbs: 2,
    fat: 4,
    quality_summary: "โปรตีนเน้นๆ คาร์บเกือบศูนย์ เหมาะสำหรับการเสริมสร้างกล้ามเนื้อและลีนไขมันมากค่ะ 💪🐔",
  },
  "ข้าวกล้อง": {
    meal_name: "ข้าวกล้อง",
    calories: 110,
    protein: 2.5,
    carbs: 23,
    fat: 1,
    quality_summary: "คาร์โบไฮเดรตเชิงซ้อนชั้นดี ใยอาหารสูง ช่วยให้อิ่มท้องนานและรักษาระดับน้ำตาลค่ะ 🌾",
  }
};

export default function MealLogger({ tdeeTarget, onMealAdded }: MealLoggerProps) {
  const [mealName, setMealName] = useState("");
  const [portion, setPortion] = useState("1");
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Online search states
  const [searchResults, setSearchResults] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedNutrients, setSelectedNutrients] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
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

  // Nutrition helper logic
  const estimateNutrition = (name: string): Omit<MealLog, "portion"> => {
    const trimmed = name.trim();
    // Try exact or partial match in db
    const matchedKey = Object.keys(FOOD_DATABASE).find(key => 
      trimmed.toLowerCase().includes(key.toLowerCase())
    );

    if (matchedKey) {
      return FOOD_DATABASE[matchedKey];
    }

    // Heuristics fallback
    let cal = 150;
    let prot = 5;
    let carb = 15;
    let f = 4;
    let desc = "สารอาหารครบถ้วน อย่าลืมแบ่งสัดส่วนจานให้สมดุลและทานผักเยอะๆ นะคะ 🥗";

    if (trimmed.includes("สลัด") || trimmed.includes("ผัก") || trimmed.includes("salad")) {
      cal = 90;
      prot = 2;
      carb = 12;
      f = 2;
      desc = "ผักใบเขียวใยอาหารสูง วิตามินจัดเต็ม ช่วยเรื่องการขับถ่ายดีเลิศค่ะ! 🥦";
    } else if (trimmed.includes("ไก่") || trimmed.includes("หมู") || trimmed.includes("ปลา") || trimmed.includes("เนื้อ") || trimmed.includes("ไข่")) {
      cal = 250;
      prot = 22;
      carb = 5;
      f = 12;
      desc = "โปรตีนจากเนื้อสัตว์ช่วยซ่อมแซมส่วนที่สึกหรอ ทานคู่กับผักจะเริ่ดมากค่ะ! 🥩";
    } else if (trimmed.includes("หวาน") || trimmed.includes("เค้ก") || trimmed.includes("ไอติม") || trimmed.includes("ทองหยิบ")) {
      cal = 350;
      prot = 2;
      carb = 55;
      f = 14;
      desc = "ขนมหวานแสนอร่อย ทานได้เพื่อฮีลใจแต่ระวังน้ำตาลนิดนึงน้าตัวเธอ 🥺🍰";
    } else if (trimmed.includes("ข้าว") || trimmed.includes("เส้น") || trimmed.includes("ขนมปัง")) {
      cal = 200;
      prot = 4;
      carb = 40;
      f = 1.5;
      desc = "คาร์โบไฮเดรตให้พลังงานหลัก วันนี้ขยับร่างกายออกกำลังกายเยอะๆ นะคะ! 🏃‍♀️";
    }

    return {
      meal_name: trimmed,
      calories: cal,
      protein: prot,
      carbs: carb,
      fat: f,
      quality_summary: desc
    };
  };

  const handleSearchOnline = async () => {
    if (!mealName.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      playClickSound();
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(mealName)}&search_simple=1&action=process&json=1`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data && data.products && data.products.length > 0) {
        const formatted = data.products
          .filter((p: any) => {
            const name = p.product_name_th || p.product_name || p.product_name_en;
            return !!name;
          })
          .slice(0, 5)
          .map((p: any) => {
            const name = p.product_name_th || p.product_name || p.product_name_en || "ไม่มีชื่อ";
            const kcal = Math.round(p.nutriments?.["energy-kcal_100g"] || p.nutriments?.["energy-kcal"] || 120);
            const protein = parseFloat((p.nutriments?.proteins_100g || 0).toFixed(1));
            const carbs = parseFloat((p.nutriments?.carbohydrates_100g || 0).toFixed(1));
            const fat = parseFloat((p.nutriments?.fat_100g || 0).toFixed(1));
            return { name, calories: kcal, protein, carbs, fat };
          });
        setSearchResults(formatted);
        if (formatted.length === 0) {
          alert("ไม่พบข้อมูลออนไลน์สำหรับเมนูนี้ ลองระบุเป็นคำง่ายๆ ดูนะคะ 🐰");
        }
      } else {
        alert("ไม่พบข้อมูลออนไลน์สำหรับเมนูนี้ ลองระบุเป็นคำง่ายๆ ดูนะคะ 🐰");
      }
    } catch (err) {
      console.error("Search API error:", err);
      alert("ไม่สามารถเชื่อมต่อฐานข้อมูลออนไลน์ได้ชั่วคราว ระบบจะใช้ค่าประมาณการแทนค่ะ");
    } finally {
      setSearching(false);
    }
  };

  const handleAddMeal = async (e: React.FormEvent, customFood?: string) => {
    if (e) e.preventDefault();
    
    const foodToLog = customFood || mealName;
    if (!foodToLog.trim()) return;

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

      const parsedPortion = parseFloat(portion) || 1;
      
      const baseNutrients = selectedNutrients && !customFood
        ? {
            meal_name: foodToLog,
            calories: selectedNutrients.calories,
            protein: selectedNutrients.protein,
            carbs: selectedNutrients.carbs,
            fat: selectedNutrients.fat,
            quality_summary: `ดึงข้อมูลจากโภชนาการออนไลน์ ได้แก่ ${foodToLog} สดใหม่สำหรับคุณ! 🛒✨`
          }
        : estimateNutrition(foodToLog);

      const newMealPayload = {
        user_id: userId,
        meal_name: baseNutrients.meal_name,
        portion: parsedPortion,
        calories: Math.round(baseNutrients.calories * parsedPortion),
        protein: parseFloat((baseNutrients.protein * parsedPortion).toFixed(1)),
        carbs: parseFloat((baseNutrients.carbs * parsedPortion).toFixed(1)),
        fat: parseFloat((baseNutrients.fat * parsedPortion).toFixed(1)),
        quality_summary: baseNutrients.quality_summary,
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
            loggedMeal = data[0];
          }
        } catch (dbErr) {
          console.warn("Supabase meal logs insert failed, falling back to local storage:", dbErr);
        }
      }

      if (!loggedMeal) {
        // Mock a database row with a local ID
        loggedMeal = {
          ...newMealPayload,
          id: "local_" + Date.now(),
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
      playBubbleSound();
      confetti({ particleCount: 30, spread: 40, colors: ["#a5d6a7", "#ffebee"] });

      setMealName("");
      setPortion("1");
      setSelectedNutrients(null);
      setSearchResults([]);
      
      if (onMealAdded) onMealAdded();
    } catch (err) {
      console.error(err);
      alert((err as Error).message || "เกิดข้อผิดพลาดในการบันทึกอาหาร");
    } finally {
      setLoading(false);
    }
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

  // Quick Adds Helper
  const quickAdds = ["ไข่ต้ม", "กล้วยน้ำว้า", "สลัดอกไก่", "ส้มตำไทย", "ชาไข่มุก", "กาแฟดำ"];

  // Daily totals
  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFat = meals.reduce((acc, m) => acc + m.fat, 0);

  const budget = tdeeTarget || 2000;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none pb-24">
      {/* Logger Input Form */}
      <div className="lg:col-span-7 bg-white border-4 border-healthy-green-light rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-2xl font-black text-healthy-green-dark mb-6 flex items-center gap-2">
          <span>🍽️ บันทึกการกินวันนี้</span>
          <span className="text-xs bg-healthy-green-light px-2.5 py-0.5 rounded-full border border-healthy-green-medium/20 text-healthy-green-dark">Meal Logger</span>
        </h2>

        <form onSubmit={(e) => handleAddMeal(e)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Meal Name input */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-healthy-green-dark/80 mb-2 pl-2">
                ชื่ออาหาร/เครื่องดื่ม (Food Name)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-healthy-green-dark/40">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={mealName}
                    onChange={(e) => {
                      setMealName(e.target.value);
                      setSelectedNutrients(null);
                    }}
                    placeholder="เช่น สลัดอกไก่, นมจืด, กล้วย"
                    className="w-full pl-12 pr-4 py-3.5 bg-soft-cream-light border-2 border-soft-cream-dark rounded-2xl focus:border-healthy-green-primary focus:ring-0 focus:outline-none text-healthy-green-dark font-semibold transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchOnline}
                  disabled={searching || !mealName.trim()}
                  className="px-4 bg-healthy-green-light border-2 border-healthy-green-medium/30 hover:border-healthy-green-primary/40 hover:bg-healthy-green-light text-healthy-green-dark rounded-2xl font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {searching ? (
                    <span className="w-4 h-4 border-2 border-healthy-green-dark border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>ค้นหาออนไลน์ 🔍</span>
                  )}
                </button>
              </div>

              {/* Suggestions dropdown */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border-2 border-healthy-green-medium/40 rounded-2xl p-3 max-h-[200px] overflow-y-auto space-y-2 shadow-sm relative z-20">
                  <div className="text-[10px] font-black text-healthy-green-dark/50 flex justify-between">
                    <span>ผลการค้นพบออนไลน์ (คลิกเพื่อเลือก)</span>
                    <button
                      type="button"
                      onClick={() => setSearchResults([])}
                      className="text-[10px] text-kawaii-pink-primary hover:text-kawaii-pink-dark font-bold cursor-pointer"
                    >
                      ปิด [x]
                    </button>
                  </div>
                  {searchResults.map((prod, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMealName(prod.name);
                        setSelectedNutrients({
                          calories: prod.calories,
                          protein: prod.protein,
                          carbs: prod.carbs,
                          fat: prod.fat
                        });
                        setSearchResults([]);
                        playBubbleSound();
                      }}
                      className="w-full text-left p-2 bg-soft-cream-light hover:bg-healthy-green-light border border-soft-cream-dark hover:border-healthy-green-medium/40 rounded-xl transition-all flex justify-between items-center text-xs font-semibold cursor-pointer"
                    >
                      <span className="truncate max-w-[60%] text-healthy-green-dark font-bold">🛒 {prod.name}</span>
                      <span className="text-healthy-green-primary font-black shrink-0">
                        🔥 {prod.calories} kcal (P:{prod.protein} C:{prod.carbs} F:{prod.fat})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Portion input */}
            <div>
              <label className="block text-sm font-bold text-healthy-green-dark/80 mb-2 pl-2">
                ปริมาณ (จาน/แก้ว/ชิ้น)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-healthy-green-dark/40">
                  <Scale className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  required
                  min={0.1}
                  max={10}
                  step="0.1"
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-soft-cream-light border-2 border-soft-cream-dark rounded-2xl focus:border-healthy-green-primary focus:ring-0 focus:outline-none text-healthy-green-dark font-semibold transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-healthy-green-primary hover:bg-healthy-green-dark text-white rounded-2xl font-bold shadow-lg shadow-healthy-green-primary/10 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>บันทึกอาหารมื้อนี้ ✨</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Add Section */}
        <div className="mt-8 border-t border-soft-cream-dark pt-6">
          <span className="block text-sm font-bold text-healthy-green-dark/60 mb-3 pl-1">
            เมนูลัดสุดฮิต (Quick Add)
          </span>
          <div className="flex flex-wrap gap-2">
            {quickAdds.map((food) => (
              <button
                key={food}
                onClick={(e) => {
                  setMealName(food);
                  handleAddMeal(e, food);
                }}
                disabled={loading}
                className="px-3 py-2 bg-soft-cream-light border-2 border-soft-cream-dark hover:border-healthy-green-primary hover:bg-healthy-green-light text-healthy-green-dark rounded-2xl font-bold text-xs transition-all transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                🐰 {food}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats and Circular Progress */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border-4 border-healthy-green-light rounded-3xl p-6 shadow-sm flex flex-col items-center">
          <h3 className="text-lg font-black text-healthy-green-dark mb-2 text-center w-full">
            สัดส่วนแคลอรี่ประจำวัน
          </h3>
          <CircularProgressBar value={totalCalories} target={budget} />

          {/* Macro Breakdown */}
          <div className="grid grid-cols-3 gap-3 w-full mt-4 text-center">
            <div className="bg-[#e3f2fd] border border-[#bbdefb] rounded-2xl p-2.5">
              <span className="block text-[10px] font-black text-blue-800">โปรตีน (Protein)</span>
              <span className="text-sm font-black text-blue-950">{totalProtein.toFixed(1)}g</span>
            </div>
            <div className="bg-butter-yellow-light border border-butter-yellow-primary/30 rounded-2xl p-2.5">
              <span className="block text-[10px] font-black text-butter-yellow-dark">คาร์บ (Carbs)</span>
              <span className="text-sm font-black text-healthy-green-dark">{totalCarbs.toFixed(1)}g</span>
            </div>
            <div className="bg-kawaii-pink-light border border-kawaii-pink-primary/30 rounded-2xl p-2.5">
              <span className="block text-[10px] font-black text-kawaii-pink-dark">ไขมัน (Fat)</span>
              <span className="text-sm font-black text-kawaii-pink-dark">{totalFat.toFixed(1)}g</span>
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
                        {meal.meal_name} ({meal.portion} ที่)
                      </span>
                      <span className="text-xs text-healthy-green-primary font-bold">
                        🔥 {meal.calories} kcal | P: {meal.protein}g C: {meal.carbs}g F: {meal.fat}g
                      </span>
                      {meal.quality_summary && (
                        <p className="text-xs text-healthy-green-dark/70 font-semibold mt-1 bg-white/50 px-2 py-1 rounded-lg border border-soft-cream-dark/50">
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

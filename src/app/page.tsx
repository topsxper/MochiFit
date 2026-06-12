"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthScreen from "@/components/AuthScreen";
import BottomNav from "@/components/BottomNav";
import MascotBanner from "@/components/MascotBanner";
import CalculatorForm from "@/components/CalculatorForm";
import MealLogger from "@/components/MealLogger";
import HealthJourney from "@/components/HealthJourney";
import CircularProgressBar from "@/components/CircularProgressBar";
import { Sparkles, Heart, Ruler, Scale, ArrowRight, Activity } from "lucide-react";

type TabType = "dashboard" | "calculator" | "logger" | "journey";

interface ProfileData {
  id?: string;
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  activity_level: string;
  bmi: number;
  bmr: number;
  tdee: number;
  body_fat: number;
}

export default function Home() {
  const [session, setSession] = useState<import("@supabase/supabase-js").Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayCarbs, setTodayCarbs] = useState(0);
  const [todayFat, setTodayFat] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code !== "PGRST116") {
          console.warn("Table 'profiles' not ready or error fetching. Using local backup.");
        }
        // Load fallback from localStorage
        const local = localStorage.getItem(`profile_${userId}`);
        if (local) {
          setProfile(JSON.parse(local));
        } else {
          setProfile(null);
        }
      } else if (data) {
        setProfile(data);
        localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStats = async (userId: string) => {
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("meal_logs")
        .select("calories, protein, carbs, fat")
        .eq("user_id", userId)
        .gte("created_at", startOfToday.toISOString());

      if (error) {
        console.warn("Table 'meal_logs' not ready or error. Using local backup.");
        // Try fallback from localStorage
        const local = localStorage.getItem(`meals_${userId}`);
        if (local) {
          const meals = JSON.parse(local) as { calories: number; protein: number; carbs: number; fat: number; created_at: string }[];
          const todayMeals = meals.filter(m => {
            const date = new Date(m.created_at || new Date());
            return date >= startOfToday;
          });
          const cal = todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
          const p = todayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
          const c = todayMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
          const f = todayMeals.reduce((acc, m) => acc + (m.fat || 0), 0);
          setTodayCalories(cal);
          setTodayProtein(p);
          setTodayCarbs(c);
          setTodayFat(f);
        } else {
          setTodayCalories(0);
          setTodayProtein(0);
          setTodayCarbs(0);
          setTodayFat(0);
        }
      } else if (data) {
        const cal = data.reduce((acc, log) => acc + (log.calories || 0), 0);
        const p = data.reduce((acc, log) => acc + (log.protein || 0), 0);
        const c = data.reduce((acc, log) => acc + (log.carbs || 0), 0);
        const f = data.reduce((acc, log) => acc + (log.fat || 0), 0);
        setTodayCalories(cal);
        setTodayProtein(p);
        setTodayCarbs(c);
        setTodayFat(f);
      }
    } catch (err) {
      console.error("Error fetching today stats:", err);
    }
  };

  useEffect(() => {
    // Force loading to false after 2 seconds to support local fallback if Supabase is blocked
    const timer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn("Supabase init timed out. Switching to offline/local fallback.");
          return false;
        }
        return prev;
      });
    }, 2000);

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timer);
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchTodayStats(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      clearTimeout(timer);
      console.warn("Supabase session load failed:", err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(timer);
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchTodayStats(session.user.id);
      } else {
        setProfile(null);
        setTodayCalories(0);
        setTodayProtein(0);
        setTodayCarbs(0);
        setTodayFat(0);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [refreshTrigger]);

  // Load guest data if isGuest becomes true
  useEffect(() => {
    if (isGuest) {
      setTimeout(() => {
        fetchProfile("guest");
        fetchTodayStats("guest");
      }, 0);
    }
  }, [isGuest]);

  const handleLogout = async () => {
    if (isGuest) {
      setIsGuest(false);
      setProfile(null);
      setTodayCalories(0);
      setTodayProtein(0);
      setTodayCarbs(0);
      setTodayFat(0);
    } else {
      await supabase.auth.signOut();
    }
  };

  const handleProfileSave = (updatedProfile: ProfileData) => {
    setProfile(updatedProfile);
    const userId = session?.user?.id || "guest";
    localStorage.setItem(`profile_${userId}`, JSON.stringify(updatedProfile));
    setRefreshTrigger(prev => prev + 1);
  };

  const handleMealAdded = () => {
    const userId = session?.user?.id || "guest";
    fetchTodayStats(userId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-soft-cream-base font-sans select-none">
        <span className="w-10 h-10 border-4 border-healthy-green-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-healthy-green-dark/60 mt-4 animate-pulse">
          กำลังเตรียมความคิ้วท์ให้คุณ... 🐰✨
        </span>
      </div>
    );
  }

  if (!session && !isGuest) {
    return (
      <AuthScreen 
        onAuthSuccess={() => setRefreshTrigger(prev => prev + 1)} 
        onGuestLogin={() => setIsGuest(true)}
      />
    );
  }

  const budget = profile?.tdee || 2000;

  return (
    <div className="min-h-screen bg-soft-cream-base text-healthy-green-dark font-sans select-none md:p-6 pb-24 md:pb-6">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-0">
        
        {/* Navigation & Header */}
        <BottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout}
          userName={profile?.name}
        />

        {/* Tab Router Content */}
        <main className="mt-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Cute Mascot Greeting */}
              <MascotBanner 
                profileName={profile?.name} 
                customText={
                  todayCalories > budget 
                    ? `อุ๊ย! คุณกินพลังงานเกิน TDEE ไปนิดนึงแล้วน้า วันนี้ลองไปขยับตัวเต้นระบำกระต่ายออกกำลังกายกันเถอะค่ะ 🐰💃` 
                    : undefined
                }
              />

              {/* Top Summary Card (Responsive: 1 col on mobile, 2 col on desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                
                {/* User Info Overview */}
                <div className="md:col-span-6 bg-white border-4 border-healthy-green-light rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-kawaii-pink-light rounded-full opacity-60 pointer-events-none" />
                  
                  <div>
                    <h3 className="text-lg font-black text-healthy-green-dark flex items-center gap-1.5 mb-4">
                      <Heart className="w-5 h-5 text-kawaii-pink-primary fill-kawaii-pink-primary" />
                      <span>ข้อมูลสุขภาพปัจจุบัน</span>
                    </h3>

                    {profile ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-soft-cream-dark pb-2">
                          <span className="text-sm font-bold text-healthy-green-dark/60">ชื่อ (Name)</span>
                          <span className="text-base font-extrabold text-healthy-green-dark">{profile.name}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-soft-cream-dark pb-2">
                          <span className="text-sm font-bold text-healthy-green-dark/60">อายุ (Age)</span>
                          <span className="text-base font-extrabold text-healthy-green-dark">{profile.age} ปี</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 bg-soft-cream-base rounded-2xl p-3 border border-soft-cream-dark">
                            <Ruler className="w-4 h-4 text-healthy-green-primary" />
                            <div>
                              <span className="block text-[10px] font-bold text-healthy-green-dark/50 leading-none">ส่วนสูง</span>
                              <span className="text-sm font-extrabold text-healthy-green-dark">{profile.height} ซม.</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-soft-cream-base rounded-2xl p-3 border border-soft-cream-dark">
                            <Scale className="w-4 h-4 text-kawaii-pink-primary" />
                            <div>
                              <span className="block text-[10px] font-bold text-healthy-green-dark/50 leading-none">น้ำหนัก</span>
                              <span className="text-sm font-extrabold text-healthy-green-dark">{profile.weight} กก.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm font-bold text-healthy-green-dark/50 mb-4">ยังไม่ได้กรอกข้อมูลสุขภาพเลยค่ะ 🥺</p>
                        <button
                          onClick={() => setActiveTab("calculator")}
                          className="px-4 py-2 bg-healthy-green-primary hover:bg-healthy-green-dark text-white rounded-2xl text-xs font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <span>ไปวิเคราะห์กันเลย</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {profile && (
                    <div className="mt-6 pt-4 border-t border-soft-cream-dark flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-bold text-healthy-green-dark/60">
                        <span>ดัชนีมวลกาย BMI: </span>
                        <span className="text-sm font-black text-healthy-green-primary">{profile.bmi}</span>
                      </div>
                      <button
                        onClick={() => setActiveTab("calculator")}
                        className="text-xs font-bold text-kawaii-pink-primary hover:text-kawaii-pink-dark cursor-pointer underline underline-offset-2"
                      >
                        แก้ไขข้อมูลส่วนตัว
                      </button>
                    </div>
                  )}
                </div>

                {/* Calorie Stats Circle Recap */}
                <div className="md:col-span-6 bg-white border-4 border-healthy-green-light rounded-3xl p-6 shadow-sm flex flex-col items-center justify-between">
                  <h3 className="text-lg font-black text-healthy-green-dark text-center w-full mb-1 flex items-center justify-center gap-1.5">
                    <Activity className="w-4 h-4 text-healthy-green-primary" />
                    <span>พลังงานที่ได้รับในวันนี้</span>
                  </h3>
                  
                  <CircularProgressBar value={todayCalories} target={budget} />
                  
                  {/* Macro details */}
                  <div className="grid grid-cols-3 gap-2 w-full text-center mt-2">
                    <div className="bg-[#e3f2fd] border border-[#bbdefb] rounded-xl py-1 px-2">
                      <span className="block text-[9px] font-bold text-blue-700">โปรตีน</span>
                      <span className="text-xs font-extrabold text-blue-900">{todayProtein.toFixed(1)}g</span>
                    </div>
                    <div className="bg-butter-yellow-light border border-butter-yellow-primary/30 rounded-xl py-1 px-2">
                      <span className="block text-[9px] font-bold text-butter-yellow-dark">คาร์โบไฮเดรต</span>
                      <span className="text-xs font-extrabold text-healthy-green-dark">{todayCarbs.toFixed(1)}g</span>
                    </div>
                    <div className="bg-kawaii-pink-light border border-kawaii-pink-primary/30 rounded-xl py-1 px-2">
                      <span className="block text-[9px] font-bold text-kawaii-pink-dark">ไขมัน</span>
                      <span className="text-xs font-extrabold text-kawaii-pink-dark">{todayFat.toFixed(1)}g</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons Link Card */}
              <div className="bg-white border-4 border-healthy-green-light rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐰</span>
                  <div>
                    <span className="block text-sm font-black text-healthy-green-dark">ทานมื้อไหนไปบ้างหรือยังคะ?</span>
                    <span className="text-xs font-bold text-healthy-green-dark/60">คลิกบันทึกและคำนวณอาหารทุกๆ วันเพื่อสุขภาพที่ดีกันเถอะ</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("logger")}
                  className="px-6 py-3 bg-healthy-green-primary hover:bg-healthy-green-dark text-white rounded-2xl font-black text-sm transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-healthy-green-primary/10 flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>บันทึกมื้ออาหารวันนี้</span>
                </button>
              </div>

            </div>
          )}

          {activeTab === "calculator" && (
            <CalculatorForm 
              key={profile?.id || "new"}
              initialProfile={profile} 
              onProfileSave={handleProfileSave} 
            />
          )}

          {activeTab === "logger" && (
            <MealLogger 
              tdeeTarget={budget} 
              onMealAdded={handleMealAdded}
            />
          )}

          {activeTab === "journey" && (
            <HealthJourney 
              currentWeight={profile?.weight || 50} 
            />
          )}
        </main>

      </div>
    </div>
  );
}

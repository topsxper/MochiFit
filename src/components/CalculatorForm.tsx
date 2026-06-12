"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Calendar, Ruler, Scale, Dumbbell, Save, Activity, Sparkles, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

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

interface CalculatorFormProps {
  initialProfile: ProfileData | null;
  onProfileSave: (profile: ProfileData) => void;
}

export default function CalculatorForm({ initialProfile, onProfileSave }: CalculatorFormProps) {
  const [name, setName] = useState(initialProfile?.name || "");
  const [age, setAge] = useState(initialProfile?.age?.toString() || "");
  const [gender, setGender] = useState(initialProfile?.gender || "female");
  const [height, setHeight] = useState(initialProfile?.height?.toString() || "");
  const [weight, setWeight] = useState(initialProfile?.weight?.toString() || "");
  const [activityLevel, setActivityLevel] = useState(initialProfile?.activity_level || "moderate");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Calculations
  const hVal = parseFloat(height);
  const wVal = parseFloat(weight);
  const aVal = parseInt(age);

  let bmi = 0;
  let bmr = 0;
  let tdee = 0;
  let bodyFat = 0;

  if (hVal > 0 && wVal > 0) {
    // 1. BMI
    bmi = parseFloat((wVal / Math.pow(hVal / 100, 2)).toFixed(1));

    // 2. BMR (Mifflin-St Jeor)
    if (aVal > 0) {
      if (gender === "male") {
        bmr = Math.round(10 * wVal + 6.25 * hVal - 5 * aVal + 5);
      } else {
        bmr = Math.round(10 * wVal + 6.25 * hVal - 5 * aVal - 161);
      }

      // 3. TDEE
      const coefficients: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        extra: 1.9,
      };
      tdee = Math.round(bmr * (coefficients[activityLevel] || 1.2));

      // 4. Body Fat % (Deurenberg Formula)
      const genderMultiplier = gender === "male" ? 1 : 0;
      bodyFat = parseFloat(((1.20 * bmi) + (0.23 * aVal) - (16.2 * genderMultiplier) - 5.4).toFixed(1));
      if (bodyFat < 0) bodyFat = 0;
    }
  }

  // Get Advice based on BMI
  const getBmiAdvice = (bmiVal: number) => {
    if (bmiVal === 0) return { text: "กรอกข้อมูลของคุณด้านซ้ายเพื่อคำนวณเลยค่ะ! 🐰", color: "text-healthy-green-dark" };
    if (bmiVal < 18.5) {
      return { 
        text: "ตอนนี้คุณผอมไปนิดนึงน้า~ 🥺 ลองทานอาหารอร่อยที่มีประโยชน์เพิ่มขึ้นอีกนิด และจิบน้ำเยอะๆ นะคะ Mochi เป็นห่วง!", 
        status: "น้ำหนักน้อยกว่าเกณฑ์ (Underweight)",
        color: "bg-butter-yellow-light border-butter-yellow-dark/30 text-butter-yellow-dark"
      };
    }
    if (bmiVal >= 18.5 && bmiVal < 25) {
      return { 
        text: "ว้าว! สัดส่วนคุณดีและสุขภาพแข็งแรงมากๆ เลยค่ะ ✨ กินน้ำเพิ่มอีกนิดและออกกำลังสม่ำเสมอจะเพอร์เฟกต์ที่สุดค่ะ!", 
        status: "สุขภาพดี สมส่วน (Healthy Weight)",
        color: "bg-healthy-green-light border-healthy-green-medium/30 text-healthy-green-dark"
      };
    }
    if (bmiVal >= 25 && bmiVal < 30) {
      return { 
        text: "อ๊ะ! น้ำหนักตัวเริ่มเพิ่มขึ้นแล้วน้า~ ลองเลือกทานของมีประโยชน์ เลี่ยงของมันของหวาน แล้วขยับร่างกายไปด้วยกันนะคะ Mochi ช่วยเชียร์ค่ะ! 💕", 
        status: "น้ำหนักเกินเกณฑ์ (Overweight)",
        color: "bg-kawaii-pink-light border-kawaii-pink-primary/30 text-kawaii-pink-dark"
      };
    }
    return { 
      text: "สุขภาพสำคัญที่สุดนะ! ลองหันมาคุมอาหาร ดื่มน้ำเยอะๆ แทนชานมไข่มุก แล้วออกกำลังกายเบาๆ เพื่อตัวคุณที่สดใสขึ้นกันเถอะค่ะ 🐰💚", 
      status: "ภาวะอ้วน (Obese)",
      color: "bg-kawaii-pink-light border-kawaii-pink-dark/30 text-kawaii-pink-dark"
    };
  };

  const advice = getBmiAdvice(bmi);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !height || !weight) {
      setMessage({ text: "กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึกนะคะ 🥺", isError: true });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      let userId = "guest";
      let dbSaved = false;

      // Safely fetch user session
      let user = null;
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user || null;
      } catch {
        // Auth API call failed or offline
      }

      if (user) {
        userId = user.id;
      }

      const profilePayload = {
        id: userId,
        name,
        age: parseInt(age),
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        activity_level: activityLevel,
        bmi,
        bmr,
        tdee,
        body_fat: bodyFat,
        updated_at: new Date().toISOString()
      };

      if (user) {
        try {
          const { error } = await supabase
            .from("profiles")
            .upsert(profilePayload);
          if (error) throw error;
          dbSaved = true;
        } catch (dbErr) {
          console.warn("Supabase profiles upsert failed, falling back to local storage:", dbErr);
        }
      }

      // Mirror state to local storage
      localStorage.setItem(`profile_${userId}`, JSON.stringify(profilePayload));

      if (user && dbSaved) {
        setMessage({ text: "บันทึกข้อมูลสุขภาพลง Supabase เรียบร้อยแล้วค่ะ! ✨💖", isError: false });
      } else if (user) {
        setMessage({ text: "บันทึกในเครื่องสำเร็จ! (Supabase ยังไม่ได้สร้างตาราง แต่ใช้งานต่อได้ปกติค่ะ) ✨🥦", isError: false });
      } else {
        setMessage({ text: "บันทึกในฐานะผู้ใช้ทดลอง (Guest Mode) บนบราวเซอร์เรียบร้อยแล้วค่ะ! 🐰✨", isError: false });
      }

      confetti({ particleCount: 100, spread: 80, colors: ["#4caf50", "#ff8a80", "#fff59d"] });
      onProfileSave(profilePayload);
    } catch (err) {
      console.error(err);
      setMessage({ text: (err as Error).message || "เกิดข้อผิดพลาดในการบันทึก ลองใหม่อีกครั้งนะคะ", isError: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none pb-24">
      {/* Form Container */}
      <div className="lg:col-span-7 bg-white border-4 border-healthy-green-light rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-2xl font-black text-healthy-green-dark mb-6 flex items-center gap-2">
          <span>🥕 กรอกข้อมูลสุขภาพ</span>
          <span className="text-xs bg-healthy-green-light px-2.5 py-0.5 rounded-full border border-healthy-green-medium/20 text-healthy-green-dark">ข้อมูลส่วนตัว</span>
        </h2>

        {message && (
          <div className={`p-4 mb-6 rounded-2xl text-sm border-2 text-center flex items-center justify-center gap-2 font-bold ${
            message.isError 
              ? "bg-kawaii-pink-light border-kawaii-pink-primary/30 text-kawaii-pink-dark" 
              : "bg-healthy-green-light border-healthy-green-medium/30 text-healthy-green-dark"
          }`}>
            {message.isError && <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-healthy-green-dark/80 mb-2 pl-2">ชื่อของคุณ (Name)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-healthy-green-dark/40">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="น้องส้มโอ"
                  className="w-full pl-12 pr-4 py-3 bg-soft-cream-light border-2 border-soft-cream-dark rounded-2xl focus:border-healthy-green-primary focus:ring-0 focus:outline-none text-healthy-green-dark font-semibold transition-colors"
                />
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-bold text-healthy-green-dark/80 mb-2 pl-2">อายุ (Age - ปี)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-healthy-green-dark/40">
                  <Calendar className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="24"
                  className="w-full pl-12 pr-4 py-3 bg-soft-cream-light border-2 border-soft-cream-dark rounded-2xl focus:border-healthy-green-primary focus:ring-0 focus:outline-none text-healthy-green-dark font-semibold transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Gender */}
            <div>
              <label className="block text-sm font-bold text-healthy-green-dark/80 mb-2 pl-2">เพศ (Gender)</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`py-3.5 rounded-2xl border-2 font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    gender === "female"
                      ? "border-kawaii-pink-primary bg-kawaii-pink-light text-kawaii-pink-dark scale-105 shadow-sm"
                      : "border-soft-cream-dark bg-soft-cream-light text-healthy-green-dark/60"
                  }`}
                >
                  <span>🌸 หญิง</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`py-3.5 rounded-2xl border-2 font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    gender === "male"
                      ? "border-healthy-green-primary bg-healthy-green-light text-healthy-green-dark scale-105 shadow-sm"
                      : "border-soft-cream-dark bg-soft-cream-light text-healthy-green-dark/60"
                  }`}
                >
                  <span>🐳 ชาย</span>
                </button>
              </div>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-bold text-healthy-green-dark/80 mb-2 pl-2">ส่วนสูง (Height - ซม.)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-healthy-green-dark/40">
                  <Ruler className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  required
                  min={50}
                  max={250}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="160"
                  className="w-full pl-12 pr-4 py-3 bg-soft-cream-light border-2 border-soft-cream-dark rounded-2xl focus:border-healthy-green-primary focus:ring-0 focus:outline-none text-healthy-green-dark font-semibold transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Weight */}
            <div>
              <label className="block text-sm font-bold text-healthy-green-dark/80 mb-2 pl-2">น้ำหนัก (Weight - กก.)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-healthy-green-dark/40">
                  <Scale className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  required
                  min={10}
                  max={300}
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="48.5"
                  className="w-full pl-12 pr-4 py-3 bg-soft-cream-light border-2 border-soft-cream-dark rounded-2xl focus:border-healthy-green-primary focus:ring-0 focus:outline-none text-healthy-green-dark font-semibold transition-colors"
                />
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-sm font-bold text-healthy-green-dark/80 mb-2 pl-2">กิจกรรมประจำวัน (Activity)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-healthy-green-dark/40">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-soft-cream-light border-2 border-soft-cream-dark rounded-2xl focus:border-healthy-green-primary focus:ring-0 focus:outline-none text-healthy-green-dark font-semibold transition-colors appearance-none cursor-pointer"
                >
                  <option value="sedentary">นิ่งอยู่กับที่ (ไม่มีการออกกำลังกาย)</option>
                  <option value="light">ขยับน้อย (ออกกำลังกาย 1-3 วัน/สัปดาห์)</option>
                  <option value="moderate">ปานกลาง (ออกกำลังกาย 3-5 วัน/สัปดาห์)</option>
                  <option value="active">ขยับเยอะ (ออกกำลังกาย 6-7 วัน/สัปดาห์)</option>
                  <option value="extra">ทำงานหนัก (กรรมกร/ฝึกกีฬาหนักทุกวัน)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-healthy-green-primary hover:bg-healthy-green-dark text-white rounded-2xl font-bold shadow-lg shadow-healthy-green-primary/10 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-8"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>บันทึกข้อมูลสุขภาพลง Supabase 🐰</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Analysis advice Card */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border-4 border-healthy-green-light rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-soft-cream-dark rounded-full opacity-40" />
          
          <h3 className="text-xl font-black text-healthy-green-dark mb-4 relative z-10 flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-healthy-green-primary" />
            <span>ผลการวิเคราะห์สุขภาพ</span>
          </h3>

          <div className="space-y-4 relative z-10">
            {/* BMI Card */}
            <div className="bg-soft-cream-base rounded-2xl p-4 border border-soft-cream-dark">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-healthy-green-dark/70">ดัชนีมวลกาย (BMI)</span>
                <span className="text-xs font-black text-healthy-green-primary">เป้าหมาย: 18.5 - 24.9</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-healthy-green-dark">{bmi > 0 ? bmi : "-"}</span>
                {bmi > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-healthy-green-light border border-healthy-green-medium/20 text-healthy-green-dark rounded-md">
                    {advice.status}
                  </span>
                )}
              </div>
            </div>

            {/* BMR & TDEE */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-soft-cream-base rounded-2xl p-4 border border-soft-cream-dark">
                <span className="block text-xs font-bold text-healthy-green-dark/70 mb-1">พลังงานพื้นฐาน (BMR)</span>
                <span className="text-xl font-black text-healthy-green-dark">
                  {bmr > 0 ? `${bmr.toLocaleString()} kcal` : "-"}
                </span>
              </div>
              <div className="bg-soft-cream-base rounded-2xl p-4 border border-soft-cream-dark">
                <span className="block text-xs font-bold text-healthy-green-dark/70 mb-1">ต้องการต่อวัน (TDEE)</span>
                <span className="text-xl font-black text-healthy-green-primary">
                  {tdee > 0 ? `${tdee.toLocaleString()} kcal` : "-"}
                </span>
              </div>
            </div>

            {/* Body Fat % */}
            <div className="bg-soft-cream-base rounded-2xl p-4 border border-soft-cream-dark">
              <span className="block text-sm font-bold text-healthy-green-dark/70 mb-1">ประมาณการไขมันในร่างกาย (Body Fat %)</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-healthy-green-dark">{bodyFat > 0 ? `${bodyFat}%` : "-"}</span>
                <span className="text-xs text-healthy-green-dark/50 font-medium">(คำนวณเบื้องต้นด้วยสูตร Deurenberg)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mascot Advice Speech Bubble */}
        <div className={`border-4 rounded-3xl p-6 shadow-sm transition-all duration-300 ${advice.color || "bg-white border-healthy-green-light"}`}>
          <div className="flex items-start gap-4">
            {/* Mascot SVG head */}
            <div className="w-14 h-14 shrink-0 bg-white rounded-full flex items-center justify-center animate-bounce-slow border border-soft-cream-dark">
              <svg viewBox="0 0 100 100" className="w-12 h-12">
                <ellipse cx="38" cy="25" rx="8" ry="20" fill="white" stroke="#ff8a80" strokeWidth="2.5" transform="rotate(-10 38 25)" />
                <ellipse cx="62" cy="25" rx="8" ry="20" fill="white" stroke="#ff8a80" strokeWidth="2.5" transform="rotate(10 62 25)" />
                <circle cx="50" cy="60" r="30" fill="white" stroke="#ff8a80" strokeWidth="2.5" />
                <circle cx="40" cy="55" r="2.5" fill="#2e7d32" />
                <circle cx="60" cy="55" r="2.5" fill="#2e7d32" />
                <circle cx="34" cy="62" r="3.5" fill="#ffebee" />
                <circle cx="66" cy="62" r="3.5" fill="#ffebee" />
                <path d="M47 61 Q50 62.5 53 61" stroke="#ff8a80" strokeWidth="2" fill="none" />
                <path d="M50 30 C48 24, 42 22, 45 18 C48 18, 52 24, 50 30" fill="#4caf50" />
              </svg>
            </div>
            
            {/* Speech bubble */}
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-healthy-green-dark/60 flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>คำแนะนำจาก Mochi ✨</span>
              </h4>
              <p className="text-sm font-semibold leading-relaxed">
                {advice.text}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

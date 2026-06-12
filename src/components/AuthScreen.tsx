"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Heart, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function AuthScreen({ 
  onAuthSuccess, 
  onGuestLogin 
}: { 
  onAuthSuccess: () => void; 
  onGuestLogin: () => void; 
}) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.session) {
          setMessage({ text: "สมัครสมาชิกสำเร็จและเข้าสู่ระบบแล้วค่ะ! ✨", isError: false });
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          setTimeout(() => {
            onAuthSuccess();
          }, 1500);
        } else {
          setMessage({ text: "สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลยืนยันตัวตนนะคะ 💌", isError: false });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        setMessage({ text: "ยินดีต้อนรับกลับมาค่ะ! กำลังเข้าสู่ระบบ... 💖", isError: false });
        confetti({ particleCount: 80, spread: 60, colors: ["#4caf50", "#ff8a80", "#fff59d"] });
        setTimeout(() => {
          onAuthSuccess();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: (err as Error).message || "เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะคะ 🥺", isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-soft-cream-base font-sans select-none">
      <div className="w-full max-w-md bg-white border-4 border-healthy-green-medium rounded-3xl p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)] relative overflow-hidden transition-all duration-300">
        
        {/* Cute decorative elements */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-kawaii-pink-light rounded-full opacity-60" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-healthy-green-light rounded-full opacity-60" />
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          {/* Animated Kawaii Mascot "Mochi" in SVG */}
          <div className="w-24 h-24 bg-kawaii-pink-light rounded-full flex items-center justify-center animate-float mb-4 border-2 border-kawaii-pink-primary/40 relative">
            <svg viewBox="0 0 100 100" className="w-20 h-20">
              {/* Ears */}
              <ellipse cx="38" cy="25" rx="8" ry="20" fill="white" stroke="#ff8a80" strokeWidth="3" transform="rotate(-10 38 25)" />
              <ellipse cx="62" cy="25" rx="8" ry="20" fill="white" stroke="#ff8a80" strokeWidth="3" transform="rotate(10 62 25)" />
              <ellipse cx="38" cy="27" rx="4" ry="14" fill="#ffebee" />
              <ellipse cx="62" cy="27" rx="4" ry="14" fill="#ffebee" />
              
              {/* Body/Head */}
              <circle cx="50" cy="60" r="30" fill="white" stroke="#ff8a80" strokeWidth="3" />
              
              {/* Eyes */}
              <circle cx="40" cy="55" r="3" fill="#2e7d32" />
              <circle cx="60" cy="55" r="3" fill="#2e7d32" />
              <circle cx="41" cy="53" r="1" fill="white" />
              <circle cx="61" cy="53" r="1" fill="white" />
              
              {/* Cheeks */}
              <circle cx="34" cy="62" r="4" fill="#ffebee" />
              <circle cx="66" cy="62" r="4" fill="#ffebee" />
              
              {/* Mouth */}
              <path d="M47 61 Q50 63 53 61" stroke="#ff8a80" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              
              {/* Little Leaf on Head */}
              <path d="M50 30 C48 24, 42 22, 45 18 C48 18, 52 24, 50 30" fill="#4caf50" />
            </svg>
            <div className="absolute -right-1 -top-1 bg-butter-yellow-primary text-healthy-green-dark p-1 rounded-full text-xs font-bold border border-white rotate-12">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-healthy-green-dark">
            MochiFit 🐰
          </h1>
          <p className="text-sm text-healthy-green-dark/70 mt-1">
            {isSignUp ? "ลงทะเบียนก้าวแรกสู่สุขภาพดีกันเถอะ!" : "ยินดีต้อนรับสู่แอปบันทึกสุขภาพสุดคิ้วท์"}
          </p>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-2xl text-sm border-2 text-center flex items-center justify-center gap-2 ${
            message.isError 
              ? "bg-kawaii-pink-light border-kawaii-pink-primary/40 text-kawaii-pink-dark" 
              : "bg-healthy-green-light border-healthy-green-medium/40 text-healthy-green-dark"
          }`}>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-semibold text-healthy-green-dark/80 mb-2 pl-2">
              อีเมล (Email)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-healthy-green-dark/40">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kitty@healthy.com"
                className="w-full pl-12 pr-4 py-3 bg-soft-cream-light border-2 border-soft-cream-dark rounded-2xl focus:border-healthy-green-primary focus:ring-0 focus:outline-none text-healthy-green-dark font-medium transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-healthy-green-dark/80 mb-2 pl-2">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-healthy-green-dark/40">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-soft-cream-light border-2 border-soft-cream-dark rounded-2xl focus:border-healthy-green-primary focus:ring-0 focus:outline-none text-healthy-green-dark font-medium transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-healthy-green-primary hover:bg-healthy-green-dark text-white rounded-2xl font-bold shadow-lg shadow-healthy-green-primary/10 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Heart className="w-5 h-5 fill-white" />
                <span>{isSignUp ? "สมัครสมาชิกกันเลย ✨" : "เข้าสู่ระบบกันเถอะ ✨"}</span>
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={onGuestLogin}
          className="w-full mt-3 py-3 border-2 border-dashed border-healthy-green-primary hover:bg-healthy-green-light/40 text-healthy-green-dark rounded-2xl font-bold transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <span>✨ ทดลองใช้งานทันที (Guest Mode)</span>
        </button>

        <div className="mt-8 text-center relative z-10 border-t border-soft-cream-dark pt-6">
          <p className="text-sm text-healthy-green-dark/60">
            {isSignUp ? "มีบัญชีอยู่แล้วใช่ไหมคะ?" : "ยังไม่มีบัญชีสุขภาพคิ้วท์ๆ หรือคะ?"}
          </p>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
            className="mt-2 text-sm font-bold text-kawaii-pink-primary hover:text-kawaii-pink-dark transition-colors underline underline-offset-4 cursor-pointer"
          >
            {isSignUp ? "เข้าสู่ระบบที่นี่ 💖" : "สมัครสมาชิกใหม่ที่นี่ 💖"}
          </button>
        </div>
      </div>
    </div>
  );
}

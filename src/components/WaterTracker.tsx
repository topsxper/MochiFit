"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { playBubbleSound, playSuccessSound } from "@/lib/sound";
import confetti from "canvas-confetti";
import { GlassWater, Sparkles } from "lucide-react";

export default function WaterTracker() {
  const [cups, setCups] = useState<boolean[]>(Array(8).fill(false));
  const [userId, setUserId] = useState("guest");
  const [dateKey, setDateKey] = useState("");

  // Get current user and today's date key
  useEffect(() => {
    const initTracker = async () => {
      let currentUserId = "guest";
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          currentUserId = data.user.id;
        }
      } catch {
        // Fallback to guest
      }
      setUserId(currentUserId);

      // YYYY-MM-DD format
      const today = new Date().toLocaleDateString("en-CA");
      setDateKey(today);

      const storageKey = `water_${currentUserId}_${today}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as boolean[];
          if (Array.isArray(parsed) && parsed.length === 8) {
            setCups(parsed);
          }
        } catch {
          // Reset if corrupted
        }
      }
    };
    initTracker();
  }, []);

  const handleToggleCup = (index: number) => {
    const newCups = [...cups];
    const targetState = !newCups[index];
    newCups[index] = targetState;

    if (targetState) {
      playBubbleSound();
    } else {
      playBubbleSound();
    }

    setCups(newCups);

    if (dateKey) {
      const storageKey = `water_${userId}_${dateKey}`;
      localStorage.setItem(storageKey, JSON.stringify(newCups));
    }

    // Trigger celebration when target is reached
    const countBefore = cups.filter(Boolean).length;
    const countAfter = newCups.filter(Boolean).length;

    if (countAfter === 8 && countBefore < 8) {
      playSuccessSound();
      confetti({
        particleCount: 50,
        spread: 60,
        colors: ["#64b5f6", "#bbdefb", "#e3f2fd", "#fff"]
      });
    }
  };

  const completedCount = cups.filter(Boolean).length;
  const currentVolume = completedCount * 250;

  return (
    <div className="bg-white border-4 border-healthy-green-light rounded-3xl p-6 shadow-sm relative overflow-hidden select-none">
      <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#e3f2fd] rounded-full opacity-60 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-lg font-black text-healthy-green-dark flex items-center gap-1.5">
            <span>💧 น้องโมจิชวนดื่มน้ำ</span>
            <span className="text-[10px] bg-[#e3f2fd] px-2 py-0.5 rounded-full border border-blue-200 text-blue-700">Water Tracker</span>
          </h3>
          <p className="text-xs text-healthy-green-dark/60 font-semibold mt-0.5">
            เป้าหมายวันนี้: 8 แก้ว (2,000 มล.)
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#e3f2fd] px-3.5 py-1.5 rounded-2xl border border-blue-100">
          <GlassWater className="w-5 h-5 text-blue-500 animate-bounce" />
          <span className="text-sm font-black text-blue-800">
            {currentVolume} / 2000 มล.
          </span>
        </div>
      </div>

      {/* Interactive Water Cup Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 my-4">
        {cups.map((filled, idx) => (
          <button
            key={idx}
            onClick={() => handleToggleCup(idx)}
            className={`h-14 rounded-2xl border-3 flex flex-col items-center justify-center transition-all duration-200 transform cursor-pointer active:scale-90 relative overflow-hidden ${
              filled
                ? "bg-[#e3f2fd] border-blue-400 text-blue-600 scale-100 shadow-md shadow-blue-200"
                : "bg-soft-cream-light border-soft-cream-dark hover:border-blue-300 text-healthy-green-dark/30 hover:scale-105"
            }`}
            title={`แก้วที่ ${idx + 1}`}
          >
            {filled ? (
              <>
                <span className="absolute inset-x-0 bottom-0 bg-blue-300/30 h-2/3 rounded-b-xl animate-pulse" />
                <GlassWater className="w-6 h-6 fill-blue-400 text-blue-600 relative z-10" />
                <span className="text-[9px] font-black relative z-10 leading-none mt-0.5">250ml</span>
              </>
            ) : (
              <>
                <GlassWater className="w-5 h-5 text-soft-cream-dark group-hover:text-blue-300" />
                <span className="text-[8px] font-semibold text-healthy-green-dark/40 mt-0.5">+{idx + 1}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Motivation message */}
      <div className="bg-[#e3f2fd]/50 border border-blue-100/50 rounded-2xl p-3 flex items-center gap-2 mt-4 text-xs font-bold text-blue-900">
        <span>✨</span>
        <p>
          {completedCount === 0 && "มาเริ่มดื่มแก้วแรกกันเลยค่ะ! น้ำดื่มช่วยเร่งการเผาผลาญนะ 🐰🥛"}
          {completedCount > 0 && completedCount < 4 && "ยอดเยี่ยมค่ะ! ร่างกายเริ่มสดชื่นขึ้นแล้ว ดื่มเพิ่มอีกนิดน้า"}
          {completedCount >= 4 && completedCount < 8 && "เกินครึ่งทางแล้ว! ผิวพรรณเปล่งปลั่งขึ้นแล้วค่ะ สู้ๆ! 💦"}
          {completedCount === 8 && (
            <span className="flex items-center gap-1 text-green-700 font-extrabold">
              <Sparkles className="w-3.5 h-3.5 fill-green-600" />
              สำเร็จภารกิจ! วันนี้ดื่มน้ำครบถ้วนแล้วค่ะ น้องโมจิภูมิใจที่สุด! 🥳🐰🌟
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

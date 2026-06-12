"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export default function MascotBanner({ 
  profileName, 
  customText,
  todayCalories = 0,
  budget = 2000
}: { 
  profileName?: string; 
  customText?: string;
  todayCalories?: number;
  budget?: number;
}) {
  // Store a single random index on mount so it remains stable during re-renders
  const [randomIndex] = useState(() => Math.floor(Math.random() * 2));

  const hour = new Date().getHours();
  const name = profileName ? `คุณ ${profileName}` : "คนเก่ง";
  
  // Calculate calorie ratio and mood
  const ratio = todayCalories / (budget || 2000);
  let mood: "hungry" | "happy" | "stuffed" = "hungry";
  if (ratio >= 0.5 && ratio <= 1.0) {
    mood = "happy";
  } else if (ratio > 1.0) {
    mood = "stuffed";
  }

  const morningGreetings = [
    `อรุณสวัสดิ์ค่ะ ${name}! มาเริ่มเช้าวันใหม่ที่ดีด้วยน้ำเปล่าสักแก้วกันเถอะนะคะ ✨☀️`,
    `สวัสดีตอนเช้าค่ะ ${name}! วันนี้ทานมื้อเช้าที่มีประโยชน์หรือยังเอ่ย? Mochi เป็นกำลังใจให้นะคะ 🐰`,
  ];
  
  const afternoonGreetings = [
    `ช่วงบ่ายแล้วนะ ${name} พักสายตาและจิบน้ำสักนิดนะคะ คนเก่งของ Mochi 🍃🥤`,
    `สู้ๆ กับช่วงบ่ายนะคะ ${name}! ถ้ารู้สึกเหนื่อย ลองยืดเส้นยืดสายดูน้า ✨🌸`,
  ];

  const eveningGreetings = [
    `วันนี้คุณ ${profileName || "ทำได้ดีมาก"} ทำได้ดีที่สุดแล้วค่ะ! ทานมื้อเย็นให้อร่อยและพักผ่อนเยอะๆ น้า 🌙🍛`,
    `ค่ำแล้วนะ ${name} อย่าลืมเข้านอนไวๆ เพื่อให้ร่างกายได้ฟื้นฟูอย่างเต็มที่นะคะ ฝันดีค่ะ 💤✨`,
  ];

  const hungryGreetings = [
    `หิวจังเลยค่ะ หาอาหารอร่อยและดีต่อสุขภาพทานกันเถอะนะคะ 🥗🐰 Mochi คอยเชียร์อยู่น้า`,
    `อย่าลืมหาอาหารที่มีโปรตีนและผักทานนะคนเก่ง เติมพลังให้ร่างกายกันหน่อยค่ะ 🥚🥑`,
  ];

  const happyGreetings = [
    `วันนี้ทำได้ดีมากๆ เลยค่ะ! ร่างกายกำลังได้รับพลังงานในเกณฑ์ที่สมบูรณ์แบบ แฮปปี้สุดๆ 🎉🐰`,
    `อุ๊ย ทานอาหารได้สัดส่วนที่ดีจังเลยค่ะ ผิวพรรณเปล่งปลั่ง สดใสสมวัยที่สุด! 🌸✨`,
  ];

  const stuffedGreetings = [
    `ว้าว วันนี้จัดเต็มอิ่มแป้เลยใช่ไหมล่ะคะ? มาเต้นสลัดไขมันกับ Mochi สัก 15 นาทีกันน้า 🏋️‍♀️🐰`,
    `ทานพลังงานเกินเป้าวันนี้ไปนิดนึงแล้วน้า เน้นดื่มน้ำเปล่าเพิ่ม และลองขยับร่างกายเบาๆ กันค่ะ 🚶‍♀️🥛`,
  ];

  // Select dialogue based on mood first, fallback to time-based
  let selectedList = hungryGreetings;
  if (mood === "happy") {
    selectedList = happyGreetings;
  } else if (mood === "stuffed") {
    selectedList = stuffedGreetings;
  } else {
    if (hour >= 5 && hour < 12) selectedList = morningGreetings;
    else if (hour >= 12 && hour < 17) selectedList = afternoonGreetings;
    else if (hour >= 17 && hour < 23) selectedList = eveningGreetings;
  }

  const greeting = customText || selectedList[randomIndex % selectedList.length];

  return (
    <div className="bg-white border-4 border-healthy-green-light rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden transition-all duration-300">
      
      {/* Decorative BG bubble */}
      <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-butter-yellow-light rounded-full opacity-60 pointer-events-none" />
      
      {/* Mascot character */}
      <div className="w-20 h-20 shrink-0 bg-kawaii-pink-light rounded-full flex items-center justify-center animate-float border border-kawaii-pink-primary/20 relative">
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          {/* Ears */}
          <ellipse cx="38" cy="25" rx="8" ry="20" fill="white" stroke="#ff8a80" strokeWidth="2.5" transform="rotate(-10 38 25)" />
          <ellipse cx="62" cy="25" rx="8" ry="20" fill="white" stroke="#ff8a80" strokeWidth="2.5" transform="rotate(10 62 25)" />
          <ellipse cx="38" cy="27" rx="4" ry="14" fill="#ffebee" />
          <ellipse cx="62" cy="27" rx="4" ry="14" fill="#ffebee" />
          
          {/* Head */}
          <circle cx="50" cy="60" r="30" fill="white" stroke="#ff8a80" strokeWidth="2.5" />
          
          {/* Eyes depending on Mood */}
          {mood === "happy" ? (
            <>
              {/* Happy closed eyes ^ ^ */}
              <path d="M35 56 Q40 50 45 56" stroke="#2e7d32" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M55 56 Q60 50 65 56" stroke="#2e7d32" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          ) : mood === "stuffed" ? (
            <>
              {/* Dizzy closed eyes > < */}
              <path d="M35 53 L42 56 L35 59" stroke="#2e7d32" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M65 53 L58 56 L65 59" stroke="#2e7d32" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Sweat drop */}
              <path d="M72 45 C72 42, 69 40, 69 40 C69 40, 66 42, 66 45 C66 47, 69 49, 72 45 Z" fill="#64b5f6" />
            </>
          ) : (
            <>
              {/* Normal eyes */}
              <circle cx="40" cy="55" r="3.2" fill="#2e7d32" />
              <circle cx="60" cy="55" r="3.2" fill="#2e7d32" />
              <circle cx="41.2" cy="53.2" r="1" fill="white" />
              <circle cx="61.2" cy="53.2" r="1" fill="white" />
            </>
          )}
          
          {/* Cheeks */}
          <circle cx="34" cy="62" r="3.5" fill="#ffebee" />
          <circle cx="66" cy="62" r="3.5" fill="#ffebee" />
          
          {/* Mouth depending on Mood */}
          {mood === "happy" ? (
            <path d="M45 61 Q50 67 55 61 Z" fill="#ff8a80" stroke="#ff8a80" strokeWidth="1" strokeLinecap="round" />
          ) : mood === "stuffed" ? (
            <circle cx="50" cy="62" r="4" fill="#ff8a80" />
          ) : (
            <path d="M47 61 Q50 63 53 61" stroke="#ff8a80" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
          
          {/* Leaf on head */}
          <path d="M50 30 C48 24, 42 22, 45 18 C48 18, 52 24, 50 30" fill="#4caf50" />
        </svg>
        <div className="absolute -right-1.5 -bottom-1 bg-healthy-green-primary text-white p-0.5 rounded-full border border-white">
          <Heart className="w-3 h-3 fill-white" />
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 relative bg-soft-cream-base border-2 border-healthy-green-medium/30 p-4 rounded-2xl w-full">
        {/* Speech Bubble Arrow */}
        <div className="absolute left-[38px] -top-2 sm:left-auto sm:right-full sm:top-1/2 sm:-translate-y-1/2 w-3.5 h-3.5 bg-soft-cream-base border-l-2 border-t-2 border-healthy-green-medium/30 rotate-[45deg] sm:rotate-[-45deg] translate-x-[2px] sm:translate-x-[9px]" />
        
        <div className="relative z-10 text-sm font-semibold text-healthy-green-dark leading-relaxed flex items-start gap-1.5">
          <span className="shrink-0 text-healthy-green-primary font-bold">Mochi:</span>
          <span>{greeting}</span>
        </div>
      </div>
      
    </div>
  );
}

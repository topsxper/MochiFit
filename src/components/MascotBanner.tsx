"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export default function MascotBanner({ 
  profileName, 
  customText 
}: { 
  profileName?: string; 
  customText?: string;
}) {
  // Store a single random index on mount so it remains stable during re-renders
  const [randomIndex] = useState(() => Math.floor(Math.random() * 2));

  const hour = new Date().getHours();
  const name = profileName ? `คุณ ${profileName}` : "คนเก่ง";
  
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

  const defaultGreetings = [
    `วันนี้อย่าลืมดื่มน้ำเยอะๆ และทานโปรตีนให้ครบนะคะ! Mochi คอยเอาใจช่วยอยู่ตรงนี้เสมอ 🐰💚`,
    `รักตัวเองให้มากๆ ในทุกๆ วันนะคะ กินอาหารอร่อยและมีประโยชน์ด้วยนะคนดี 💕🥗`,
  ];

  let selectedList = defaultGreetings;
  if (hour >= 5 && hour < 12) selectedList = morningGreetings;
  else if (hour >= 12 && hour < 17) selectedList = afternoonGreetings;
  else if (hour >= 17 && hour < 23) selectedList = eveningGreetings;

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
          
          {/* Eyes */}
          <circle cx="40" cy="55" r="2.5" fill="#2e7d32" />
          <circle cx="60" cy="55" r="2.5" fill="#2e7d32" />
          <circle cx="41" cy="53" r="0.8" fill="white" />
          <circle cx="61" cy="53" r="0.8" fill="white" />
          
          {/* Cheeks */}
          <circle cx="34" cy="62" r="3.5" fill="#ffebee" />
          <circle cx="66" cy="62" r="3.5" fill="#ffebee" />
          
          {/* Mouth */}
          <path d="M47 61 Q50 62.5 53 61" stroke="#ff8a80" strokeWidth="2" fill="none" strokeLinecap="round" />
          
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
        <div className="absolute left-[38px] -top-2 sm:left-auto sm:right-full sm:top-1/2 sm:-translate-y-1/2 w-3.5 h-3.5 bg-soft-cream-base border-l-2 border-t-2 border-healthy-green-medium/30 rotate-[-45deg] sm:rotate-[-45deg] translate-x-[2px] sm:translate-x-[9px]" />
        
        <div className="relative z-10 text-sm font-semibold text-healthy-green-dark leading-relaxed flex items-start gap-1.5">
          <span className="shrink-0 text-healthy-green-primary font-bold">Mochi:</span>
          <span>{greeting}</span>
        </div>
      </div>
      
    </div>
  );
}

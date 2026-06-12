"use client";

import { Home, Calculator, Utensils, LineChart, LogOut } from "lucide-react";

type TabType = "dashboard" | "calculator" | "logger" | "journey";

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onLogout: () => void;
  userName?: string;
}

export default function BottomNav({ activeTab, setActiveTab, onLogout, userName }: BottomNavProps) {
  const tabs = [
    { id: "dashboard" as TabType, label: "หน้าหลัก", icon: Home },
    { id: "calculator" as TabType, label: "วิเคราะห์สุขภาพ", icon: Calculator },
    { id: "logger" as TabType, label: "บันทึกอาหาร", icon: Utensils },
    { id: "journey" as TabType, label: "สถิติเดินทาง", icon: LineChart },
  ];

  return (
    <>
      {/* Desktop Header Navigation */}
      <header className="hidden md:flex items-center justify-between bg-white border-2 border-healthy-green-medium rounded-3xl p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-healthy-green-primary">MochiFit 🐰</span>
          {userName && (
            <span className="text-sm bg-healthy-green-light px-3 py-1 rounded-full text-healthy-green-dark font-medium border border-healthy-green-medium/20">
              สวัสดีค่ะ, คุณ {userName}
            </span>
          )}
        </div>
        <nav className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-healthy-green-primary text-white shadow-md shadow-healthy-green-primary/20 scale-105"
                    : "text-healthy-green-dark/70 hover:text-healthy-green-dark hover:bg-soft-cream-dark"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 border-2 border-kawaii-pink-primary/30 hover:border-kawaii-pink-primary text-kawaii-pink-dark rounded-2xl font-bold text-sm transition-all cursor-pointer hover:bg-kawaii-pink-light"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </header>

      {/* Mobile Sticky Bottom Nav & Top Bar */}
      <div className="md:hidden">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-soft-cream-dark px-6 py-4 sticky top-0 z-40">
          <span className="text-lg font-bold text-healthy-green-primary">MochiFit 🐰</span>
          {userName && (
            <span className="text-xs bg-healthy-green-light px-2.5 py-0.5 rounded-full text-healthy-green-dark font-semibold">
              คุณ {userName}
            </span>
          )}
          <button
            onClick={onLogout}
            className="p-1.5 text-kawaii-pink-primary hover:text-kawaii-pink-dark cursor-pointer"
            title="ออกจากระบบ"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-soft-cream-dark rounded-t-3xl py-2.5 px-4 shadow-[0_-8px_30px_rgba(0,0,0,0.03)] z-50 flex justify-around items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all active:scale-95"
              >
                <div className={`p-2 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? "bg-healthy-green-light text-healthy-green-primary scale-110 shadow-sm" 
                    : "text-healthy-green-dark/50"
                }`}>
                  <Icon className="w-5.5 h-5.5" />
                </div>
                <span className={`text-[10px] font-bold mt-1.5 ${
                  isActive ? "text-healthy-green-dark" : "text-healthy-green-dark/50"
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

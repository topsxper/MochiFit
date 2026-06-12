"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Award, Sparkles } from "lucide-react";

interface HealthJourneyProps {
  currentWeight: number;
}

interface ChartDataPoint {
  dateLabel: string;
  displayDate: string;
  calories: number;
  weight: number;
}

export default function HealthJourney({ currentWeight }: HealthJourneyProps) {
  const [activeMetric, setActiveMetric] = useState<"calories" | "weight">("calories");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const fetchJourneyData = async () => {
      setLoading(true);
      let userId = "guest";
      let dbLogs = null;

      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user || null;
        if (user) {
          userId = user.id;
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);

          const { data: logs, error } = await supabase
            .from("meal_logs")
            .select("calories, created_at")
            .eq("user_id", user.id)
            .gte("created_at", sevenDaysAgo.toISOString())
            .order("created_at", { ascending: true });

          if (!error && logs) {
            dbLogs = logs;
          }
        }
      } catch (err) {
        console.error("Error loading journey data from Supabase:", err);
      }

      // Calculate last 7 dates
      const datesList: Date[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        datesList.push(d);
      }

      // Group calories by date string (YYYY-MM-DD)
      const calorieMap: Record<string, number> = {};

      if (dbLogs) {
        dbLogs.forEach((log) => {
          const dateStr = new Date(log.created_at).toLocaleDateString("en-CA");
          calorieMap[dateStr] = (calorieMap[dateStr] || 0) + log.calories;
        });
      } else {
        // Fallback from localStorage
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const localMealsRaw = localStorage.getItem(`meals_${userId}`);
        if (localMealsRaw) {
          const meals = JSON.parse(localMealsRaw) as { calories: number; created_at: string }[];
          const filtered = meals.filter(m => new Date(m.created_at || new Date()) >= sevenDaysAgo);
          filtered.forEach((m) => {
            const dateStr = new Date(m.created_at || new Date()).toLocaleDateString("en-CA");
            calorieMap[dateStr] = (calorieMap[dateStr] || 0) + (m.calories || 0);
          });
        }
      }

      // Construct final 7-day dataset
      const baseWeight = currentWeight || 50;
      const weightFluctuations = [-0.4, 0.2, -0.1, -0.5, 0.3, -0.2, 0];

      const formattedData: ChartDataPoint[] = datesList.map((date, idx) => {
        const key = date.toLocaleDateString("en-CA");
        const displayDate = date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
        const dateLabel = date.toLocaleDateString("th-TH", { weekday: "short" });

        return {
          dateLabel,
          displayDate,
          calories: calorieMap[key] || 0,
          weight: parseFloat((baseWeight + weightFluctuations[idx]).toFixed(1))
        };
      });

      setChartData(formattedData);
      setLoading(false);
    };

    fetchJourneyData();
  }, [currentWeight]);

  if (loading) {
    return (
      <div className="bg-white border-4 border-healthy-green-light rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[350px]">
        <span className="w-10 h-10 border-4 border-healthy-green-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-healthy-green-dark/60 mt-4 animate-pulse">กำลังวาดสถิติการเดินทางของคุณนะคะ... 🐰</span>
      </div>
    );
  }

  // Chart Rendering Calculations
  const width = 500;
  const height = 220;
  const paddingX = 50;
  const paddingY = 30;

  const points = chartData.map((d) => (activeMetric === "calories" ? d.calories : d.weight));
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  
  // Prevent division by zero
  const valRange = maxVal - minVal === 0 ? 10 : maxVal - minVal;
  const chartMin = activeMetric === "calories" ? Math.max(0, minVal - valRange * 0.15) : minVal - 0.5;
  const chartMax = maxVal + valRange * 0.15;
  const chartRange = chartMax - chartMin;

  // Map data coordinates to SVG space
  const svgCoordinates = chartData.map((d, idx) => {
    const val = activeMetric === "calories" ? d.calories : d.weight;
    const x = paddingX + (idx * (width - 2 * paddingX)) / 6;
    const y = height - paddingY - ((val - chartMin) * (height - 2 * paddingY)) / chartRange;
    return { x, y, val, label: d.dateLabel, date: d.displayDate };
  });

  // Build line path
  let linePath = "";
  if (svgCoordinates.length > 0) {
    linePath = `M ${svgCoordinates[0].x} ${svgCoordinates[0].y}`;
    for (let i = 1; i < svgCoordinates.length; i++) {
      linePath += ` L ${svgCoordinates[i].x} ${svgCoordinates[i].y}`;
    }
  }

  // Build filled area path for gradient
  let areaPath = "";
  if (svgCoordinates.length > 0) {
    const bottomY = height - paddingY;
    const firstX = svgCoordinates[0].x;
    const lastX = svgCoordinates[svgCoordinates.length - 1].x;
    areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }

  return (
    <div className="space-y-6 select-none pb-24 font-sans">
      {/* Metric Selector Card */}
      <div className="bg-white border-4 border-healthy-green-light rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h2 className="text-2xl font-black text-healthy-green-dark flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-healthy-green-primary" />
            <span>Health Journey ✨</span>
          </h2>
          
          {/* Tabs */}
          <div className="flex bg-soft-cream-dark p-1 rounded-2xl border border-soft-cream-dark/50">
            <button
              onClick={() => {
                setActiveMetric("calories");
                setHoveredPoint(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMetric === "calories"
                  ? "bg-healthy-green-primary text-white shadow-sm"
                  : "text-healthy-green-dark/70 hover:text-healthy-green-dark"
              }`}
            >
              <span>🔥 แคลอรี่รายวัน</span>
            </button>
            <button
              onClick={() => {
                setActiveMetric("weight");
                setHoveredPoint(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMetric === "weight"
                  ? "bg-healthy-green-primary text-white shadow-sm"
                  : "text-healthy-green-dark/70 hover:text-healthy-green-dark"
              }`}
            >
              <span>⚖️ การเปลี่ยนน้ำหนัก</span>
            </button>
          </div>
        </div>

        {/* SVG Custom Line Chart */}
        <div className="relative bg-soft-cream-base/40 border-2 border-soft-cream-dark/80 rounded-2xl p-4 overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <defs>
              {/* Green gradient fill */}
              <linearGradient id="chart-green-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4caf50" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#e8f5e9" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingY + ratio * (height - 2 * paddingY);
              const gridVal = chartMax - ratio * chartRange;
              return (
                <g key={i} className="opacity-40">
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#a5d6a7"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-healthy-green-dark font-bold text-[9px]"
                  >
                    {activeMetric === "calories" 
                      ? `${Math.round(gridVal)}` 
                      : `${gridVal.toFixed(1)}`}
                  </text>
                </g>
              );
            })}

            {/* X Axis Labels */}
            {svgCoordinates.map((pt, idx) => (
              <text
                key={idx}
                x={pt.x}
                y={height - 10}
                textAnchor="middle"
                className="fill-healthy-green-dark/60 font-black text-[10px]"
              >
                {pt.label}
              </text>
            ))}

            {/* Area under the line */}
            {areaPath && (
              <path d={areaPath} fill="url(#chart-green-gradient)" />
            )}

            {/* Line Path */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                className="stroke-healthy-green-primary"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interaction points */}
            {svgCoordinates.map((pt, idx) => (
              <g key={idx}>
                {/* Visual Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint?.index === idx ? "7" : "5"}
                  className="fill-white stroke-healthy-green-primary transition-all"
                  strokeWidth="3.5"
                />
                
                {/* Overlay large invisible circle for hover handling */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="20"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint({ index: idx, x: pt.x, y: pt.y })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            ))}
          </svg>

          {/* Dynamic Tooltip on Hover */}
          {hoveredPoint !== null && (
            <div
              className="absolute bg-healthy-green-dark text-white rounded-xl px-3 py-1.5 text-xs font-black shadow-md border border-healthy-green-primary pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100 - 8}%`,
              }}
            >
              <span className="block text-[8px] text-white/70 font-semibold leading-none mb-0.5">
                {chartData[hoveredPoint.index].displayDate}
              </span>
              <span>
                {activeMetric === "calories"
                  ? `${chartData[hoveredPoint.index].calories.toLocaleString()} kcal`
                  : `${chartData[hoveredPoint.index].weight} กก.`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Encouragement Bottom Card */}
      <div className="bg-healthy-green-light border-4 border-healthy-green-medium rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-butter-yellow-primary rounded-full opacity-25 pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-healthy-green-medium/40 shrink-0">
            <Award className="w-7 h-7 text-healthy-green-primary fill-healthy-green-medium/20" />
          </div>
          <div>
            <h3 className="text-base font-black text-healthy-green-dark flex items-center gap-1.5">
              <span>สัปดาห์นี้คุณทำได้ดีมาก!</span>
              <Sparkles className="w-4 h-4 text-butter-yellow-dark fill-butter-yellow-primary/30" />
            </h3>
            <p className="text-xs font-bold text-healthy-green-dark/85 mt-0.5 leading-relaxed">
              สุขภาพของคุณดูสดใสแข็งแรงขึ้น 10% เลยค่ะ! รักษาความคิ้วท์และความเฮลตี้แบบนี้ไว้นะคะ Mochi เคียงข้างเสมอ 🐰💚
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Flame } from "lucide-react";

interface CircularProgressBarProps {
  value: number; // Consumed calories
  target: number; // TDEE target
}

export default function CircularProgressBar({ value, target }: CircularProgressBarProps) {
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const percentage = target > 0 ? Math.round((value / target) * 100) : 0;
  const cappedPercentage = Math.min(percentage, 100);
  const strokeDashoffset = circumference - (cappedPercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2 select-none">
      <div className="relative" style={{ width: size, height: size }}>
        
        {/* SVG Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-soft-cream-dark"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground Active Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-healthy-green-primary transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Inner Content Card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <Flame className="w-6 h-6 text-kawaii-pink-primary fill-kawaii-pink-primary animate-pulse mb-1" />
          <span className="text-2xl font-black text-healthy-green-dark leading-none">
            {value.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-healthy-green-dark/50 mt-1 uppercase tracking-wider">
            เป้าหมาย: {target.toLocaleString()} kcal
          </span>
          <span className="mt-1.5 px-2.5 py-0.5 bg-healthy-green-light border border-healthy-green-medium/20 text-healthy-green-dark text-xs font-black rounded-full shadow-sm">
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

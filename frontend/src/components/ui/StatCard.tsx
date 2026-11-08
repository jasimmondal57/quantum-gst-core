import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  change?: string;
  icon?: React.ReactNode;
  accentColor?: "emerald" | "blue" | "amber" | "rose" | "purple" | "slate";
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  trend,
  change,
  icon,
  accentColor = "emerald",
  onClick,
}) => {
  const iconBg = {
    emerald: "bg-[#e8f5ee] text-[#167a55]",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    purple: "bg-purple-50 text-purple-600",
    slate: "bg-slate-100 text-slate-600",
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </div>
      </div>

      {(subValue || change) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={`inline-flex items-center font-medium gap-0.5 ${
                trend === "up"
                  ? "text-emerald-600"
                  : trend === "down"
                  ? "text-rose-600"
                  : "text-slate-500"
              }`}
            >
              {trend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
              {trend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
              {change}
            </span>
          )}
          {subValue && <span className="text-slate-400">{subValue}</span>}
        </div>
      )}
    </div>
  );
};

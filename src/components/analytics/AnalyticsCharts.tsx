"use client";

import React, { useState } from "react";
import { TrendingUp, PieChart as PieChartIcon, Activity, IndianRupee, Layers } from "lucide-react";

// ----------------------------------------------------
// 1. Interactive SVG Sales Line Trend Graph
// ----------------------------------------------------
export interface LineGraphPoint {
  date: string;
  label: string;
  salesRupees: number;
  packets: number;
}

export function SalesTrendLineGraph({
  data,
  title = "Sales Revenue Trend",
  subtitle = "Hover over data points to inspect date, revenue, and packet count",
}: {
  data: LineGraphPoint[];
  title?: string;
  subtitle?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-700">
        <Activity className="h-8 w-8 text-zinc-300 mb-2" />
        <p className="text-xs font-semibold">No sales timeline data available yet</p>
      </div>
    );
  }

  // If there is only 1 data point, generate a visually pleasing 2-point curve starting from the baseline or earlier point
  const chartData: LineGraphPoint[] =
    data.length === 1
      ? [
          { date: "Start", label: "Prior", salesRupees: 0, packets: 0 },
          { ...data[0] },
        ]
      : data;

  const width = 640;
  const height = 240;
  const padding = { top: 30, right: 35, bottom: 45, left: 55 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...chartData.map((d) => d.salesRupees), 100);
  const minVal = 0;

  // 4 horizontal guide lines
  const steps = 4;
  const yTicks = Array.from({ length: steps + 1 }, (_, i) =>
    Math.round(minVal + (maxVal / steps) * i)
  );

  const points = chartData.map((d, i) => {
    const x =
      chartData.length === 1
        ? padding.left + innerWidth / 2
        : padding.left + (i / (chartData.length - 1)) * innerWidth;
    const y =
      padding.top +
      innerHeight -
      ((d.salesRupees - minVal) / (maxVal - minVal || 1)) * innerHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? "M" : "L"} ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

  // Determine active point to highlight in the legend
  const activePoint =
    hoveredIdx !== null
      ? points[hoveredIdx]
      : data.length === 1
      ? points[1]
      : points[points.length - 1];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-rose-100 bg-white p-4.5 sm:p-6 shadow-[0_8px_30px_rgba(104,48,66,0.04)] h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[#156035]">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h3 className="font-playfair text-lg sm:text-xl font-bold text-zinc-900">{title}</h3>
          </div>
          <p className="mt-0.5 text-xs text-zinc-800">{subtitle}</p>
        </div>

        {activePoint && (
          <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-[#FFF8FA] px-3 py-1.5 border border-rose-100">
            <span className="text-[11px] font-bold text-zinc-800">{activePoint.label}:</span>
            <span className="font-mono text-xs font-bold text-[#E61C5D]">
              ₹{activePoint.salesRupees.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-zinc-700">({activePoint.packets} pkts)</span>
          </div>
        )}
      </div>

      <div className="mt-4 relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[340px] sm:min-w-full overflow-visible select-none"
        >
          <defs>
            <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E61C5D" stopOpacity="0.25" />
              <stop offset="90%" stopColor="#E61C5D" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="salesLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#156035" />
              <stop offset="100%" stopColor="#E61C5D" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, idx) => {
            const y =
              padding.top +
              innerHeight -
              ((tick - minVal) / (maxVal - minVal || 1)) * innerHeight;
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#F3F4F6"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-zinc-700 font-mono text-[10px]"
                >
                  ₹{tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#salesAreaGradient)" />

          {/* Line Path */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#salesLineGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover highlight guideline */}
          {hoveredIdx !== null && (
            <line
              x1={points[hoveredIdx].x}
              y1={padding.top}
              x2={points[hoveredIdx].x}
              y2={height - padding.bottom}
              stroke="#E61C5D"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Data Points */}
          {points.map((p, i) => (
            <g
              key={i}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === i ? 7 : 5}
                className={`transition-all ${
                  hoveredIdx === i
                    ? "fill-[#E61C5D] stroke-white stroke-[2.5px]"
                    : "fill-white stroke-[#156035] stroke-[2.5px]"
                }`}
              />
              {/* X Axis Label */}
              <text
                x={p.x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className={`text-[10px] font-medium transition-colors ${
                  hoveredIdx === i ? "fill-[#E61C5D] font-bold" : "fill-zinc-500"
                }`}
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. Interactive SVG Donut / Pie Chart
// ----------------------------------------------------
export interface PieSlice {
  label: string;
  value: number;
  color: string;
  secondaryLabel?: string;
}

export function SalesDonutPieChart({
  slices,
  title = "Revenue by Territory",
  subtitle = "Share distribution across operational districts",
  centerValue,
  centerLabel = "Total Revenue",
}: {
  slices: PieSlice[];
  title?: string;
  subtitle?: string;
  centerValue?: string;
  centerLabel?: string;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (!slices || slices.length === 0 || total === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-700">
        <PieChartIcon className="h-8 w-8 text-zinc-300 mb-2" />
        <p className="text-xs font-semibold">No distribution data available</p>
      </div>
    );
  }

  const size = 190;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercentage = 0;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-rose-100 bg-white p-4.5 sm:p-6 shadow-[0_8px_30px_rgba(104,48,66,0.04)] h-full">
      <div className="border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-[#E61C5D]">
            <PieChartIcon className="h-4 w-4" />
          </span>
          <h3 className="font-playfair text-lg sm:text-xl font-bold text-zinc-900">{title}</h3>
        </div>
        <p className="mt-0.5 text-xs text-zinc-800">{subtitle}</p>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6">
        {/* SVG Donut */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 select-none"
          >
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
            />

            {slices.map((slice, idx) => {
              const percentage = slice.value / total;
              const strokeDasharray = `${circumference * percentage} ${
                circumference * (1 - percentage)
              }`;
              const strokeDashoffset = -circumference * accumulatedPercentage;
              accumulatedPercentage += percentage;

              const isHovered = activeIdx === idx;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseLeave={() => setActiveIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
            {activeIdx !== null ? (
              <>
                <p className="font-mono text-sm sm:text-base font-bold text-zinc-900">
                  {Math.round((slices[activeIdx].value / total) * 100)}%
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#E61C5D] truncate max-w-[85px]">
                  {slices[activeIdx].label}
                </p>
              </>
            ) : (
              <>
                <p className="text-base sm:text-lg font-bold font-sans tracking-tight text-zinc-900 leading-tight">
                  {centerValue || `₹${total.toLocaleString("en-IN")}`}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                  {centerLabel}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="w-full flex-1 space-y-2">
          {slices.map((slice, idx) => {
            const pct = Math.round((slice.value / total) * 100);
            const isHovered = activeIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition cursor-pointer ${
                  isHovered ? "bg-rose-50/80 border border-rose-200" : "hover:bg-zinc-50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-zinc-800">{slice.label}</p>
                    {slice.secondaryLabel && (
                      <p className="text-[10px] text-zinc-700 truncate">{slice.secondaryLabel}</p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span className="font-mono text-xs font-bold text-zinc-800">
                    ₹{slice.value.toLocaleString("en-IN")}
                  </span>
                  <span className="ml-1 text-[10px] font-semibold text-zinc-700">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

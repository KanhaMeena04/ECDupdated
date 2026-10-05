import React, { useState } from "react";
import StatsCards from "../components/StatsCards";
import TodayOrdersCard from "../components/TodayOrdersCard";
import RecentOrders from "../components/RecentOrders";
import { useOrderDashboard } from "../../api/order";
import { FilterList, CalendarToday, Refresh } from "@mui/icons-material";

export default function Dashboard() {
  const [period, setPeriod] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { stats, todayOrders, recentOrders, loading, refetch } = useOrderDashboard({
    period,
    startDate,
    endDate,
  });

  const periodOptions = [
    { key: "today", label: "Today", icon: "📅" },
    { key: "weekly", label: "Weekly (7d)", icon: "🗓️" },
    { key: "monthly", label: "Monthly", icon: "📊" },
    { key: "yearly", label: "Yearly", icon: "📈" },
    { key: "all", label: "All Time", icon: "🕒" },
    { key: "custom", label: "Custom Date", icon: "📆" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gradient-to-t from-gray-100 to-gray-50 md:p-8">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <FilterList fontSize="small" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Dashboard Overview</h2>
            <p className="text-xs text-gray-500">Real-time stats and period calculations</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {periodOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                period === opt.key
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}

          <button
            onClick={() => refetch()}
            disabled={loading}
            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 transition-all ml-1"
            title="Refresh Data"
          >
            <Refresh fontSize="small" className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Custom Date Inputs if Custom period is active */}
      {period === "custom" && (
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarToday fontSize="small" className="text-emerald-700" />
            <span className="text-xs font-bold text-emerald-900">Custom Date Range:</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="font-semibold text-gray-700">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="font-semibold text-gray-700">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Breakdown & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayOrdersCard todayOrders={todayOrders} />
        <RecentOrders recentOrders={recentOrders} />
      </div>
    </div>
  );
}

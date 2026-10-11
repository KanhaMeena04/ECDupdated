import React, { useState } from "react";
import StatsCards from "../components/StatsCards";
import TodayOrdersCard from "../components/TodayOrdersCard";
import RecentOrders from "../components/RecentOrders";
import OrderTrendsChart from "../components/OrderTrendsChart";
import { useOrderDashboard } from "../../api/order";
import {
  FilterList,
  CalendarToday,
  Refresh,
  BarChartRounded,
  ReceiptLongRounded,
  DashboardCustomizeRounded,
} from "@mui/icons-material";

export default function OrderDashboard() {
  // Folder / View Mode: "overview" (Total Orders & Graph) | "recent" (Recent Orders) | "split" (All-in-One)
  const [activeFolder, setActiveFolder] = useState("overview");

  // Total Orders & Analytics Period Filter
  const [period, setPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Recent Orders Live Status Filter (independent client-side)
  const [recentStatusFilter, setRecentStatusFilter] = useState("all");

  const {
    stats,
    todayOrders,
    recentOrders,
    statusCounts,
    liveStatusCounts,
    chartData,
    loading,
    refetch,
  } = useOrderDashboard({
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

  const liveOrdersCount = Array.isArray(recentOrders) ? recentOrders.length : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gradient-to-t from-gray-100 to-gray-50 min-h-screen">
      {/* Top Navigation: Separate Folders / Views Header */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
            <span>Orders Management & Analytics</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Switch between Total Orders Analytics (with graph charts) and Live Recent Orders feed
          </p>
        </div>

        {/* Folder Switcher Tabs */}
        <div className="bg-gray-100/90 p-1.5 rounded-xl flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveFolder("overview")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeFolder === "overview"
                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-black/5"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <BarChartRounded fontSize="small" />
            <span>Total Orders & Analytics</span>
          </button>

          <button
            onClick={() => setActiveFolder("recent")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeFolder === "recent"
                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-black/5"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <ReceiptLongRounded fontSize="small" />
            <span>Recent Orders (Live)</span>
            {liveOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">
                {liveOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveFolder("split")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeFolder === "split"
                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-black/5"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <DashboardCustomizeRounded fontSize="small" />
            <span>Combined View</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FOLDER 1: TOTAL ORDERS & ANALYTICS (GRAPH CHART + KPI STATS + BREAKDOWN) */}
      {/* ========================================================================= */}
      {(activeFolder === "overview" || activeFolder === "split") && (
        <div className="space-y-6">
          {/* Dedicated Period Filter Bar for Total Orders */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <FilterList fontSize="small" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  Total Orders Period Filter
                </h2>
                <p className="text-xs text-gray-500">
                  Select period to calculate order stats and render trends chart
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              {periodOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setPeriod(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    period === opt.key
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
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
                title="Refresh Analytics"
              >
                <Refresh fontSize="small" className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Custom Date Inputs if Custom period is active */}
          {period === "custom" && (
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 flex flex-wrap items-center gap-4">
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

          {/* Stats Cards (Period Total, Completed, Cancelled, Processing) */}
          <StatsCards stats={stats} />

          {/* Graph Chart & Period Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive Graph Chart (Order Trends) - 2 Columns */}
            <div className="lg:col-span-2">
              <OrderTrendsChart
                chartData={chartData}
                period={period}
                stats={stats}
                onSelectPeriod={setPeriod}
                totalDbOrders={recentOrders.length}
              />
            </div>

            {/* Total Orders Summary Card - 1 Column */}
            <div className="lg:col-span-1">
              <TodayOrdersCard todayOrders={todayOrders} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FOLDER 2: RECENT ORDERS (LIVE REAL-TIME STREAM WITH DEDICATED STATUS TABS) */}
      {/* ========================================================================= */}
      {(activeFolder === "recent" || activeFolder === "split") && (
        <div className="space-y-4">
          {activeFolder === "split" && (
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Live Recent Orders Stream
                </h3>
                <p className="text-xs text-gray-500">
                  Real-time incoming orders with independent status filters and instant search
                </p>
              </div>
            </div>
          )}

          {/* Recent Orders Component with its own independent status tabs & search */}
          <div className="w-full">
            <RecentOrders
              recentOrders={recentOrders}
              statusCounts={liveStatusCounts || statusCounts}
              statusFilter={recentStatusFilter}
              onStatusChange={setRecentStatusFilter}
              loading={loading}
              onRefresh={refetch}
            />
          </div>
        </div>
      )}
    </div>
  );
}

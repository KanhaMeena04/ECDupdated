import React from "react";
import {
  Search,
  CalendarToday,
  Refresh,
  ShoppingBag,
  PedalBike,
  ReceiptLong,
  CurrencyRupee,
  Clear,
} from "@mui/icons-material";

export default function OrderFilterHeader({
  title = "Orders",
  breadcrumbs = [],
  orders = [],
  searchQuery = "",
  onSearchChange,
  selectedDate = "",
  onDateChange,
  timeRange = "all",
  onTimeRangeChange,
  loading = false,
  onRefresh,
}) {
  const todayStr = new Date().toISOString().split("T")[0];

  // Calculate live stats from the passed orders list
  const totalCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total || o.totalAmount || 0) || 0), 0);
  const deliveryCount = orders.filter((o) => (o.orderType || "").toLowerCase().includes("delivery")).length;
  const pickupCount = orders.filter((o) => (o.orderType || "").toLowerCase().includes("pickup") || (o.orderType || "").toLowerCase().includes("self")).length;

  return (
    <div className="space-y-4 mb-5">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span>Order Management</span>
            <span>/</span>
            <span className="font-semibold text-emerald-700">{title}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {totalCount} Orders
            </span>
            {selectedDate && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                Filtered: {selectedDate === todayStr ? "Today" : selectedDate}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time filtered list with date range, quick search, and live status insights.
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Date Picker Control */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <CalendarToday className="text-emerald-700" sx={{ fontSize: 16 }} />
            <span className="text-xs font-semibold text-gray-600">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange && onDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
            />
            {selectedDate ? (
              <button
                onClick={() => onDateChange && onDateChange("")}
                className="text-[11px] font-bold text-rose-600 hover:underline ml-1"
                title="Clear date filter"
              >
                Clear
              </button>
            ) : (
              <button
                onClick={() => onDateChange && onDateChange(todayStr)}
                className="text-[11px] font-bold text-emerald-600 hover:underline ml-1"
                title="Filter by Today"
              >
                Today
              </button>
            )}
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={() => onRefresh()}
              disabled={loading}
              className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Refresh Orders"
            >
              <Refresh fontSize="small" className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Quick Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ReceiptLong fontSize="small" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total Orders</p>
            <p className="text-base font-extrabold text-gray-900 truncate">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <CurrencyRupee fontSize="small" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total Value</p>
            <p className="text-base font-extrabold text-gray-900 truncate">₹{totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <PedalBike fontSize="small" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Delivery</p>
            <p className="text-base font-extrabold text-gray-900 truncate">{deliveryCount}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <ShoppingBag fontSize="small" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Self Pickup</p>
            <p className="text-base font-extrabold text-gray-900 truncate">{pickupCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name, Mobile, Restaurant, Address..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange && onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Clear sx={{ fontSize: 14 }} />
            </button>
          )}
        </div>

        {/* Quick Time Range Pills */}
        {onTimeRangeChange && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {[
              { key: "all", label: "All Time" },
              { key: "today", label: "Today" },
              { key: "weekly", label: "This Week" },
              { key: "monthly", label: "This Month" },
            ].map((tab) => {
              const active = timeRange === tab.key && !selectedDate;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (onDateChange) onDateChange("");
                    onTimeRangeChange(tab.key);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200/80"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

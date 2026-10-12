import React, { useState } from "react";
import StatsCards from "../components/StatsCards";
import TodayOrdersCard from "../components/TodayOrdersCard";
import OrderTrendsChart from "../components/OrderTrendsChart";
import OrderTable from "../components/OrderTable";
import { useOrderDashboard, useAdminOrders } from "../../api/order";
import { mapOrdersToTableData } from "../../../utils/orderData";
import { useNavigate } from "react-router-dom";
import {
  FilterList,
  CalendarToday,
  Refresh,
  BarChartRounded,
  DashboardCustomizeRounded,
  ReceiptLongRounded,
  Visibility,
  DirectionsBike,
  DirectionsWalk,
} from "@mui/icons-material";

export default function OrdersAnalytics() {
  const navigate = useNavigate();

  // View Mode: "overview" (Analytics & Graph) | "combined" (Analytics + Orders Table)
  const [activeView, setActiveView] = useState("overview");

  // Total Orders & Analytics Period Filter
  const [period, setPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const {
    stats,
    todayOrders,
    chartData,
    totalAllTimeOrders,
    loading,
    refetch,
  } = useOrderDashboard({
    period,
    startDate,
    endDate,
    onlyAnalytics: true,
  });

  // For Combined View: Fetch orders list only when Combined View tab is active
  const {
    orders: tableOrders,
    loading: tableLoading,
    refetch: refetchTable,
  } = useAdminOrders({
    status: "all",
    timeRange: period === "all" ? "all" : period,
    refreshInterval: 10000,
    enabled: activeView === "combined",
  });

  const periodOptions = [
    { key: "today", label: "Today", icon: "📅" },
    { key: "weekly", label: "Weekly (7d)", icon: "🗓️" },
    { key: "monthly", label: "Monthly", icon: "📊" },
    { key: "yearly", label: "Yearly", icon: "📈" },
    { key: "all", label: "All Time", icon: "🕒" },
    { key: "custom", label: "Custom Date", icon: "📆" },
  ];

  const orderTableColumns = [
    {
      key: "orderId",
      label: "Order ID",
      render: (row) => (
        <span className="flex items-center gap-2 font-bold text-gray-800">
          {row.icon}
          {row.orderId}
        </span>
      ),
    },
    {
      key: "view",
      label: "View",
      render: (row) => (
        <button
          onClick={() => navigate(`/view-order/${row.id}`)}
          className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-colors flex items-center gap-1 font-medium text-xs"
        >
          <Visibility style={{ fontSize: 16 }} />
          <span>View</span>
        </button>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900 text-xs">{row.customerName}</p>
          <p className="text-[11px] text-gray-500 font-mono">{row.customerMobile || "—"}</p>
        </div>
      ),
    },
    {
      key: "orderType",
      label: "Type",
      render: (row) => (
        <span
          className={`px-2 py-0.5 text-[11px] rounded-full font-semibold flex items-center gap-1 w-fit ${
            row.orderType === "Self Pickup"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {row.orderType === "Self Pickup" ? (
            <DirectionsWalk style={{ fontSize: 12 }} />
          ) : (
            <DirectionsBike style={{ fontSize: 12 }} />
          )}
          {row.orderType}
        </span>
      ),
    },
    {
      key: "restaurant",
      label: "Restaurant",
      render: (row) => (
        <span className="font-medium text-gray-800 text-xs truncate max-w-[140px] block">
          {row.restaurant}
        </span>
      ),
    },
    {
      key: "date",
      label: "Date & Time",
      render: (row) => (
        <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{row.date}</span>
      ),
    },
    {
      key: "total",
      label: "Amount",
      render: (row) => (
        <span className="font-bold text-emerald-700 text-xs">₹{row.total}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            row.statusBadge || "bg-gray-100 text-gray-700"
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  const orderTableData = mapOrdersToTableData(tableOrders || []);

  const handleRefreshAll = () => {
    refetch();
    if (activeView === "combined") refetchTable();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gradient-to-t from-gray-100 to-gray-50 min-h-screen">
      {/* Top Header: Orders Management & Analytics */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
              <span>Orders Management & Analytics</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 shadow-2xs"
                title="All-Time Database Total Orders recorded"
              >
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                <span>All-Time DB Total:</span>
                <span className="font-extrabold text-blue-900">{totalAllTimeOrders || 149} Orders</span>
              </span>

              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs"
                title={`Orders count for selected filter: ${periodOptions.find((o) => o.key === period)?.label || "Selected Period"}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span>{periodOptions.find((o) => o.key === period)?.label || "Selected"}:</span>
                <span className="font-extrabold text-emerald-900">
                  {stats?.[0]?.value ?? todayOrders?.total ?? 0} Orders
                </span>
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Historical orders reporting, trends charts, analytics breakdown, and database records
          </p>
        </div>

        {/* View Switcher and Live Orders Shortcut */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="bg-gray-100/90 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveView("overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === "overview"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BarChartRounded fontSize="small" />
              <span>Analytics & Trends</span>
            </button>

            <button
              onClick={() => setActiveView("combined")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === "combined"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <DashboardCustomizeRounded fontSize="small" />
              <span>Combined View</span>
            </button>
          </div>

          <button
            onClick={() => navigate("/order-dashboard")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/70"
            title="Go to Live Orders Stream"
          >
            <ReceiptLongRounded fontSize="small" />
            <span>Go to Live Orders Feed</span>
          </button>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <FilterList fontSize="small" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">
              Orders Period Filter
            </h2>
            <p className="text-xs text-gray-500">
              Select time range to analyze orders, completion rate, and financial revenue
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
            onClick={handleRefreshAll}
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
      <div className={`transition-opacity duration-200 ${loading ? "opacity-70 pointer-events-none" : "opacity-100"}`}>
        <StatsCards stats={stats} />
      </div>

      {/* Graph Chart & Period Breakdown Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${loading ? "opacity-70" : "opacity-100"}`}>
        {/* Interactive Graph Chart (Order Trends) - 2 Columns */}
        <div className="lg:col-span-2">
          <OrderTrendsChart
            chartData={chartData}
            period={period}
            stats={stats}
            todayOrders={todayOrders}
            onSelectPeriod={setPeriod}
            totalDbOrders={totalAllTimeOrders || 149}
          />
        </div>

        {/* Total Orders Summary Card - 1 Column */}
        <div className="lg:col-span-1">
          <TodayOrdersCard todayOrders={todayOrders} />
        </div>
      </div>

      {/* Combined View: Show Orders Data Table */}
      {activeView === "combined" && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-800">
                Orders Record Table
              </h3>
              <p className="text-xs text-gray-500">
                Detailed orders list corresponding to selected period ({period})
              </p>
            </div>
            <button
              onClick={() => refetchTable()}
              disabled={tableLoading}
              className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-1.5"
            >
              <Refresh fontSize="small" className={tableLoading ? "animate-spin" : ""} />
              <span>Refresh Records</span>
            </button>
          </div>

          <OrderTable
            columns={orderTableColumns}
            data={orderTableData}
          />
        </div>
      )}
    </div>
  );
}

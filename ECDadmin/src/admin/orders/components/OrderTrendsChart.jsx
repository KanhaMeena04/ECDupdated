import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { TrendingUp, ShowChart, AttachMoney, CheckCircleOutline } from "@mui/icons-material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function OrderTrendsChart({ chartData, period = "today", stats = [], onSelectPeriod, totalDbOrders = 0 }) {
  const [chartMode, setChartMode] = useState("orders"); // "orders" | "comparison" | "revenue"
  const [chartType, setChartType] = useState("line"); // "line" | "bar"

  const rawLabels = chartData?.labels || [];
  const rawOrders = chartData?.orders || [];
  const rawCompleted = chartData?.completed || [];
  const rawCancelled = chartData?.cancelled || [];
  const rawRevenue = chartData?.revenue || [];

  const defaultLabels =
    rawLabels.length > 0
      ? rawLabels
      : period === "today"
      ? ["12 AM", "3 AM", "6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const ordersData = rawOrders.length > 0 ? rawOrders : new Array(defaultLabels.length).fill(0);
  const completedData = rawCompleted.length > 0 ? rawCompleted : new Array(defaultLabels.length).fill(0);
  const cancelledData = rawCancelled.length > 0 ? rawCancelled : new Array(defaultLabels.length).fill(0);
  const revenueData = rawRevenue.length > 0 ? rawRevenue : new Array(defaultLabels.length).fill(0);

  const totalPeriodOrders = ordersData.reduce((a, b) => a + b, 0);
  const totalPeriodRevenue = revenueData.reduce((a, b) => a + b, 0);
  const peakOrders = Math.max(...ordersData, 0);

  let datasets = [];

  if (chartMode === "orders") {
    datasets = [
      {
        label: "Total Orders",
        data: ordersData,
        borderColor: "#248C70",
        backgroundColor: "rgba(36, 140, 112, 0.15)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.38,
        pointBackgroundColor: "#248C70",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ];
  } else if (chartMode === "comparison") {
    datasets = [
      {
        label: "Completed Orders",
        data: completedData,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.38,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
      {
        label: "Cancelled Orders",
        data: cancelledData,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.08)",
        borderWidth: 2,
        fill: true,
        tension: 0.38,
        pointBackgroundColor: "#ef4444",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ];
  } else if (chartMode === "revenue") {
    datasets = [
      {
        label: "Order Revenue (₹)",
        data: revenueData,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.38,
        pointBackgroundColor: "#f59e0b",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ];
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 12, weight: "bold", family: "Inter, sans-serif" },
          color: "#374151",
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            if (chartMode === "revenue") {
              return ` Revenue: ₹${Number(ctx.raw || 0).toLocaleString("en-IN")}`;
            }
            return ` ${ctx.dataset.label}: ${ctx.raw} orders`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6b7280", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 10,
        grid: { color: "#f3f4f6" },
        ticks: {
          color: "#6b7280",
          font: { size: 11 },
          precision: 0,
          callback: (val) => (chartMode === "revenue" ? `₹${val}` : val),
        },
      },
    },
  };

  const periodLabel =
    period === "today"
      ? "Today"
      : period === "weekly"
      ? "Last 7 Days"
      : period === "monthly"
      ? "This Month"
      : period === "yearly"
      ? "This Year"
      : period === "all"
      ? "All Time"
      : "Selected Period";

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 flex flex-col justify-between">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <ShowChart fontSize="small" />
            </span>
            <h3 className="text-base font-bold text-gray-800">
              Order Analytics & Trends ({periodLabel})
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time graphical breakdown of order volume, completions and revenue
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Tabs */}
          <div className="bg-gray-100 p-1 rounded-lg flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setChartMode("orders")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                chartMode === "orders" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setChartMode("comparison")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                chartMode === "comparison" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Completed vs Cancelled
            </button>
            <button
              onClick={() => setChartMode("revenue")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                chartMode === "revenue" ? "bg-white text-amber-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Revenue
            </button>
          </div>

          {/* Line vs Bar toggle */}
          <div className="bg-gray-100 p-1 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setChartType("line")}
              className={`px-2 py-1 rounded-md transition-all ${
                chartType === "line" ? "bg-white text-gray-800 shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
              }`}
              title="Line Chart"
            >
              📈 Line
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-2 py-1 rounded-md transition-all ${
                chartType === "bar" ? "bg-white text-gray-800 shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
              }`}
              title="Bar Chart"
            >
              📊 Bar
            </button>
          </div>
        </div>
      </div>

      {/* Mini KPI Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-medium">Period Total</span>
            <p className="text-base font-bold text-gray-800">{totalPeriodOrders} Orders</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
            {periodLabel}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-medium">Period Revenue</span>
            <p className="text-base font-bold text-emerald-700">₹{totalPeriodRevenue.toLocaleString("en-IN")}</p>
          </div>
          <AttachMoney fontSize="small" className="text-emerald-500" />
        </div>

        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[11px] text-gray-500 font-medium">Peak Slot</span>
            <p className="text-base font-bold text-gray-800">{peakOrders} Orders</p>
          </div>
          <TrendingUp fontSize="small" className="text-blue-500" />
        </div>
      </div>

      {/* Helper Banner when selected period has 0 orders */}
      {totalPeriodOrders === 0 && (
        <div className="mb-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-emerald-900">
            <span className="text-base">📊</span>
            <span>
              <strong>0 orders recorded for {periodLabel}.</strong> Total historical orders exist in database.
            </span>
          </div>
          {onSelectPeriod && (
            <button
              type="button"
              onClick={() => onSelectPeriod("all")}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-all whitespace-nowrap cursor-pointer"
            >
              Show All Time Trends ({totalDbOrders || 149} Orders) ↗
            </button>
          )}
        </div>
      )}

      {/* Graph Display Area */}
      <div className="h-64 sm:h-72 w-full pt-1">
        {chartType === "line" ? (
          <Line data={{ labels: defaultLabels, datasets }} options={chartOptions} />
        ) : (
          <Bar data={{ labels: defaultLabels, datasets }} options={chartOptions} />
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import RecentOrders from "../components/RecentOrders";
import { useOrderDashboard } from "../../api/order";
import { useNavigate } from "react-router-dom";
import {
  BarChartRounded,
  Refresh,
} from "@mui/icons-material";

export default function OrderDashboard() {
  const navigate = useNavigate();

  // Recent Orders Live Status Filter (client-side reactive)
  const [recentStatusFilter, setRecentStatusFilter] = useState("all");

  const {
    recentOrders,
    statusCounts,
    liveStatusCounts,
    loading,
    refetch,
  } = useOrderDashboard({
    period: "today",
  });

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const live24hOrders = Array.isArray(recentOrders)
    ? recentOrders.filter((o) => !o.createdAt || new Date(o.createdAt).getTime() >= cutoff)
    : [];
  const liveOrdersCount = live24hOrders.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gradient-to-t from-gray-100 to-gray-50 min-h-screen">
      {/* Top Header: Pure Live Orders Page Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
              <span>Live Orders</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Feed
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
              {liveOrdersCount} Active (24h)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time feed of live and recent incoming orders from the last 24 hours
          </p>
        </div>

        {/* Action Link to Orders Analytics & Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Live Orders"
          >
            <Refresh fontSize="small" className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate("/orders-analytics")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            title="Go to Orders Analytics & Reports"
          >
            <BarChartRounded fontSize="small" />
            <span>Orders Analytics & History</span>
          </button>
        </div>
      </div>

      {/* Main Content: Pure Live Orders Feed Component */}
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
  );
}

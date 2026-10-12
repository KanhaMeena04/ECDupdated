import React, { useState, useMemo } from "react";
import {
  AccessTime,
  CheckCircle,
  Warning,
  OpenInNew,
  Storefront,
  Person,
  PedalBike,
  ShoppingBag,
  RestaurantMenu,
  LocalShipping,
  DoneAll,
  Search,
  Refresh,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const STATUS_TABS = [
  { key: "all", label: "All", badgeKey: "all", color: "gray" },
  { key: "pending", label: "Pending", badgeKey: "pending", color: "amber" },
  { key: "accepted", label: "Accepted", badgeKey: "accepted", color: "sky" },
  { key: "preparing", label: "Preparing", badgeKey: "preparing", color: "purple" },
  { key: "assigned", label: "Assigned", badgeKey: "assigned", color: "blue" },
  { key: "ready", label: "Ready", badgeKey: "ready", color: "teal" },
  { key: "picked_up", label: "Picked Up", badgeKey: "picked_up", color: "indigo" },
  { key: "cancelled", label: "Cancelled", badgeKey: "cancelled", color: "rose" },
  { key: "delivered", label: "Delivered", badgeKey: "delivered", color: "emerald" },
];

const getStatusConfig = (normalizedStatus, rawStatus) => {
  const status = (normalizedStatus || rawStatus || "").toLowerCase();
  if (status.includes("cancel") || status.includes("failed")) {
    return {
      Icon: Warning,
      bg: "bg-rose-50",
      text: "text-rose-600",
      border: "border-rose-100",
      pillBg: "bg-rose-100/70",
      pillText: "text-rose-700",
      label: "Cancelled",
    };
  }
  if (status.includes("deliver") || status.includes("complet")) {
    return {
      Icon: CheckCircle,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      pillBg: "bg-emerald-100/70",
      pillText: "text-emerald-700",
      label: "Delivered",
    };
  }
  if (status.includes("picked") || status.includes("out_for") || status.includes("way")) {
    return {
      Icon: LocalShipping,
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-100",
      pillBg: "bg-indigo-100/70",
      pillText: "text-indigo-700",
      label: "Picked Up",
    };
  }
  if (status.includes("ready")) {
    return {
      Icon: DoneAll,
      bg: "bg-teal-50",
      text: "text-teal-600",
      border: "border-teal-100",
      pillBg: "bg-teal-100/70",
      pillText: "text-teal-700",
      label: "Ready",
    };
  }
  if (status.includes("assign")) {
    return {
      Icon: PedalBike,
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
      pillBg: "bg-blue-100/70",
      pillText: "text-blue-700",
      label: "Assigned",
    };
  }
  if (status.includes("prepar")) {
    return {
      Icon: RestaurantMenu,
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-100",
      pillBg: "bg-purple-100/70",
      pillText: "text-purple-700",
      label: "Preparing",
    };
  }
  if (status.includes("accept")) {
    return {
      Icon: CheckCircle,
      bg: "bg-sky-50",
      text: "text-sky-600",
      border: "border-sky-100",
      pillBg: "bg-sky-100/70",
      pillText: "text-sky-700",
      label: "Accepted",
    };
  }
  return {
    Icon: AccessTime,
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    pillBg: "bg-amber-100/70",
    pillText: "text-amber-700",
    label: "Pending",
  };
};

const formatName = (val, fallback = "") => {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    return val.en || val.hi || val.name || val.title || (Object.values(val).find(v => typeof v === 'string') || fallback);
  }
  return String(val);
};

const normalizeOrderStatus = (ord) => {
  const norm = (ord?.normalizedStatus || "").toLowerCase();
  if (norm) {
    if (norm === "placed") return "pending";
    if (norm.includes("cancel") || norm.includes("fail")) return "cancelled";
    if (norm.includes("deliver") || norm.includes("complet")) return "delivered";
    if (norm.includes("pick") || norm.includes("out_for") || norm.includes("way") || norm.includes("partner_picked") || norm.includes("reached")) return "picked_up";
    return norm;
  }
  const raw = (ord?.rawStatus || ord?.status || "").toLowerCase();
  if (raw.includes("cancel") || raw.includes("fail")) return "cancelled";
  if (raw.includes("deliver") || raw.includes("complet")) return "delivered";
  if (raw.includes("pick") || raw.includes("out_for") || raw.includes("way") || raw.includes("partner_picked") || raw.includes("reached")) return "picked_up";
  if (raw.includes("ready")) return "ready";
  if (raw.includes("assign")) return "assigned";
  if (raw.includes("prepar")) return "preparing";
  if (raw.includes("accept")) return "accepted";
  return "pending";
};

export default function RecentOrders({
  recentOrders: propRecentOrders,
  statusCounts: propStatusCounts,
  statusFilter: propStatusFilter,
  onStatusChange,
  loading = false,
  onRefresh,
}) {
  const navigate = useNavigate();
  const [internalStatusFilter, setInternalStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activeFilter = propStatusFilter !== undefined ? propStatusFilter : internalStatusFilter;
  const rawOrders = propRecentOrders || [];
  const statusCounts = propStatusCounts || {};

  const handleTabClick = (key) => {
    setInternalStatusFilter(key);
    if (onStatusChange) {
      onStatusChange(key);
    }
  };

  // Filter strictly to orders created in the last 24 hours, sorted newest first
  const valid24hOrders = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return (Array.isArray(rawOrders) ? rawOrders : [])
      .filter((ord) => {
        if (!ord.createdAt) return true;
        const t = new Date(ord.createdAt).getTime();
        return !isNaN(t) ? t >= cutoff : true;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [rawOrders]);

  // Tab counts strictly derived from 24h orders
  const tabCounts = useMemo(() => {
    const counts = { all: valid24hOrders.length };
    STATUS_TABS.forEach((t) => {
      if (t.key !== "all") counts[t.key] = 0;
    });
    valid24hOrders.forEach((ord) => {
      const norm = normalizeOrderStatus(ord);
      counts[norm] = (counts[norm] || 0) + 1;
    });
    return counts;
  }, [valid24hOrders]);

  // Filter orders client-side for instant reactive response and search
  const filteredOrders = useMemo(() => {
    let list = [...valid24hOrders];

    // Client-side status filter
    if (activeFilter && activeFilter !== "all") {
      list = list.filter((ord) => normalizeOrderStatus(ord) === activeFilter);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((ord) => {
        const code = String(ord.orderCode || ord.orderNumber || ord.id || ord._id || "").toLowerCase();
        const rest = formatName(ord.restaurantName || ord.restaurant?.name || ord.restaurant, "").toLowerCase();
        const cust = formatName(ord.customerName || ord.customer?.name || ord.customer, "").toLowerCase();
        const rdr = formatName(ord.riderName || ord.rider?.name || ord.rider?.user?.name, "").toLowerCase();
        return code.includes(q) || rest.includes(q) || cust.includes(q) || rdr.includes(q);
      });
    }

    return list;
  }, [valid24hOrders, activeFilter, searchQuery]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 h-full flex flex-col">
      {/* Header Section */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-white to-gray-50/50">
        <div className="flex items-center gap-2.5">
          <h3 className="text-lg font-bold text-gray-800">
            Recent Orders
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">
            Auto-updates every 5s
          </span>
          {onRefresh && (
            <button
              onClick={() => onRefresh()}
              className="p-1 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Refresh Orders"
            >
              <Refresh fontSize="small" className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Bar (All Required Statuses) */}
      <div className="p-3 border-b border-gray-100 bg-gray-50/40">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200">
          {STATUS_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            const count = tabCounts[tab.key] !== undefined ? tabCounts[tab.key] : (statusCounts && statusCounts[tab.badgeKey] !== undefined ? statusCounts[tab.badgeKey] : 0);

            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20"
                    : "bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-100/80 hover:text-gray-900"
                }`}
              >
                <span>{tab.label}</span>
                {(tab.key === "all" || count > 0) && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Search Within Active Filter */}
        <div className="mt-2.5 relative">
          <input
            type="text"
            placeholder="Search by Order ID, Restaurant, Customer, Rider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
          <Search className="absolute left-2.5 top-2 text-gray-400" sx={{ fontSize: 16 }} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1.5 text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[560px]">
        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-gray-400 space-y-2">
            <p className="text-sm font-semibold text-gray-500">
              {searchQuery
                ? `No orders matching "${searchQuery}"`
                : activeFilter !== "all"
                ? `No ${activeFilter.replace("_", " ")} orders in the last 24 hours`
                : "No live orders received in the last 24 hours"}
            </p>
            <p className="text-xs text-gray-400">
              Recent orders from the last 24 hours will appear here automatically. Older orders are safely stored in Total Orders & Analytics history.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const cfg = getStatusConfig(order.normalizedStatus, order.rawStatus || order.status);
            const StatusIcon = cfg.Icon;
            const restaurantTitle = formatName(order.restaurantName || order.restaurant?.name || order.restaurant, "Restaurant");
            const customerTitle = formatName(order.customerName || order.customer?.name || order.customer, "Customer");
            const riderTitle = formatName(order.riderName || order.rider?.name || order.rider?.user?.name, "");
            const isPickup = order.orderType === "self_pickup" || order.orderType === "pickup";
            const orderIdClean = (order.orderNumber || order.orderCode || order.id || "").replace("#", "") || (order._id ? order._id.slice(-6).toUpperCase() : "");

            return (
              <div
                key={order._id || order.id}
                onClick={() => navigate(`/view-order/${order._id || orderIdClean}`)}
                className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-all cursor-pointer group"
                title="Click to view live order details"
              >
                {/* Left Side: Status Icon & Details */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    <StatusIcon fontSize="small" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Top Row: Order Code, Restaurant, Type, Status Pill */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-gray-900 text-sm tracking-wide">
                        {order.orderCode || order.orderNumber || `#${orderIdClean}`}
                      </span>

                      {/* Prominent Restaurant Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 truncate max-w-[180px]">
                        <Storefront sx={{ fontSize: 13 }} />
                        {restaurantTitle}
                      </span>

                      {/* Order Type Badge */}
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                        {isPickup ? (
                          <>
                            <ShoppingBag sx={{ fontSize: 11 }} /> Pickup
                          </>
                        ) : (
                          <>
                            <PedalBike sx={{ fontSize: 11 }} /> Delivery
                          </>
                        )}
                      </span>

                      {/* Live Status Pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.pillBg} ${cfg.pillText}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.text.replace('text-', 'bg-')} animate-ping`} />
                        {order.status || cfg.label}
                      </span>
                    </div>

                    {/* Bottom Row: Customer & Rider */}
                    <div className="flex items-center gap-2.5 mt-1.5 text-xs text-gray-500 flex-wrap">
                      <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                        <Person sx={{ fontSize: 13 }} className="text-gray-400" />
                        <span className="font-medium text-gray-700">{customerTitle}</span>
                        {order.customerId && (
                          <span className="text-[10px] text-gray-400">({order.customerId})</span>
                        )}
                      </span>

                      {riderTitle ? (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-purple-100">
                            <PedalBike sx={{ fontSize: 12 }} />
                            Rider: {riderTitle}
                            {order.riderId && <span className="opacity-75">({order.riderId})</span>}
                          </span>
                        </>
                      ) : !isPickup ? (
                        <>
                          <span>•</span>
                          <span className="text-[11px] text-amber-600 font-medium">
                            No rider assigned
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Right Side: Amount, Time & Action */}
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right">
                    <p className="font-extrabold text-gray-900 text-sm">
                      {order.inrAmount || order.amount || `₹${Number(order.totalAmount || 0).toFixed(2)}`}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/view-order/${order._id || orderIdClean}`);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all border border-transparent group-hover:border-emerald-200"
                    title="View live order details"
                  >
                    <OpenInNew sx={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

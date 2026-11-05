import React, { useState, useMemo } from "react";
import { Visibility, ShoppingCart, ShoppingBag, DirectionsBike } from "@mui/icons-material";
import OrderTable from "../components/OrderTable";
import OrderFilterHeader from "../components/OrderFilterHeader";
import { useNavigate } from "react-router-dom";
import { useAdminOrders } from "../../api/order.js";

export default function AbandonOrders() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [timeRange, setTimeRange] = useState("all");

  const { orders, loading, error, refetch } = useAdminOrders({
    status: "abandon",
    date: selectedDate,
    timeRange,
    search: searchQuery,
  });

  const abandonOrdersData = useMemo(() => {
    return (orders || []).map((o) => ({
      ...o,
      id: o._id || o.id,
      orderId: o.orderNumber || o.orderId || `CART-${(o._id || '').slice(-6).toUpperCase()}`,
      customerName: o.customerName || o.customer?.name || "Customer",
      customerId: o.customerId || o.customer?.customerId || "—",
      customerMobile: o.customerMobile || o.customer?.mobile || "—",
      restaurant: o.restaurantName || o.restaurant?.name || "ECD Partner Restaurant",
      restaurantId: o.restaurantId || (o.restaurant?._id ? `RNT${o.restaurant._id.slice(-4).toUpperCase()}` : "—"),
      date: new Date(o.createdAt || o.updatedAt || Date.now()).toLocaleString("en-IN"),
      orderType: o.orderType || "Delivery",
      status: o.statusLabel || o.status || "Abandoned",
      total: Number(o.totalAmount || o.total || 0).toFixed(2),
      itemsCount: o.itemsCount || (Array.isArray(o.items) ? o.items.length : 0),
    }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let list = abandonOrdersData;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          (o.orderId || "").toLowerCase().includes(q) ||
          (o.customerName || "").toLowerCase().includes(q) ||
          (o.customerMobile || "").toLowerCase().includes(q) ||
          (o.restaurant || "").toLowerCase().includes(q)
      );
    }
    if (selectedDate) {
      list = list.filter((o) => {
        if (!o.createdAt && !o.date) return true;
        const dStr = o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "";
        return dStr ? dStr === selectedDate : true;
      });
    }
    return list;
  }, [abandonOrdersData, searchQuery, selectedDate]);

  const abandonOrdersColumns = [
    {
      key: "orderId",
      label: "Cart / Order ID",
      render: (row) => (
        <span className="flex items-center gap-2 font-bold text-gray-800">
          <ShoppingCart className="text-amber-600" sx={{ fontSize: 18 }} />
          {row.orderId}
        </span>
      ),
    },
    {
      key: "customerName",
      label: "Customer Details",
      render: (row) => (
        <div>
          <p className="font-bold text-gray-800 text-xs">{row.customerName}</p>
          <p className="text-[11px] text-gray-500 font-mono">
            {row.customerId && row.customerId !== "—" ? <span className="text-emerald-700 font-semibold mr-1">#{row.customerId}</span> : null}
            {row.customerMobile && row.customerMobile !== "—" ? row.customerMobile : "—"}
          </p>
        </div>
      ),
    },
    {
      key: "restaurant",
      label: "Restaurant",
      render: (row) => (
        <div>
          <span className="font-bold text-gray-800 text-xs block truncate max-w-[160px]" title={row.restaurant}>
            {row.restaurant}
          </span>
          {row.restaurantId && row.restaurantId !== "—" ? (
            <span className="text-[10px] font-semibold text-blue-700 font-mono">#{row.restaurantId}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "itemsCount",
      label: "Cart Items",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
          {row.itemsCount || 1} Item(s)
        </span>
      ),
    },
    { key: "date", label: "Last Active Time" },
    {
      key: "status",
      label: "Drop-off State",
      render: (row) => (
        <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
          {row.status || "Abandoned Cart"}
        </span>
      ),
    },
    {
      key: "total",
      label: "Potential Value",
      render: (row) => <span className="font-extrabold text-gray-900">₹{Number(row.total).toFixed(2)}</span>,
    },
  ];

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 bg-gradient-to-t from-gray-100 to-gray-50 min-h-screen space-y-4">
      <OrderFilterHeader
        title="Abandoned Orders & Carts"
        orders={filteredOrders}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        loading={loading}
        onRefresh={refetch}
      />

      <OrderTable
        columns={abandonOrdersColumns}
        data={filteredOrders}
        loading={loading}
        onView={(row) => row.id && !row.id.startsWith("CART-") ? navigate(`/view-order/${row.id}`) : null}
        emptyMessage="No abandoned carts or incomplete checkouts found"
        onResetFilters={() => {
          setSearchQuery("");
          setSelectedDate("");
          setTimeRange("all");
        }}
      />
      {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
    </div>
  );
}

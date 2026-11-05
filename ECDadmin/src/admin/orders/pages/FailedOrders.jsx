import React, { useState, useMemo } from "react";
import { Visibility } from "@mui/icons-material";
import OrderTable from "../components/OrderTable";
import OrderFilterHeader from "../components/OrderFilterHeader";
import { useNavigate } from "react-router-dom";
import { useAdminOrders } from "../../api/order.js";
import { mapFailedOrders } from "../../../utils/orderData.js";

export default function FailedOrders() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [timeRange, setTimeRange] = useState("all");

  const { orders, loading, error, refetch } = useAdminOrders({
    status: "failed",
    date: selectedDate,
    timeRange,
    search: searchQuery,
  });

  const failedOrdersData = useMemo(() => mapFailedOrders(orders), [orders]);

  const filteredOrders = useMemo(() => {
    let list = failedOrdersData;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          (o.orderId || "").toLowerCase().includes(q) ||
          (o.customerName || "").toLowerCase().includes(q) ||
          (o.customerMobile || "").toLowerCase().includes(q) ||
          (o.restaurant || "").toLowerCase().includes(q) ||
          (o.address || "").toLowerCase().includes(q)
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
  }, [failedOrdersData, searchQuery, selectedDate]);

  const failedOrdersColumns = [
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
      key: "customerName",
      label: "Customer Name",
      render: (row) => (
        <div>
          <p className="font-bold text-gray-800 text-xs">{row.customerName}</p>
          <p className="text-[11px] text-gray-500 font-mono">
            {row.customerId ? <span className="text-emerald-700 font-semibold mr-1">#{row.customerId}</span> : null}
            {row.customerMobile && row.customerMobile !== "—" ? row.customerMobile : "—"}
          </p>
        </div>
      ),
    },
    {
      key: "orderType",
      label: "Order Type",
      render: (row) => (
        <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-gray-100 text-gray-700">
          {row.orderType}
        </span>
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
          {row.restaurantId ? (
            <span className="text-[10px] font-semibold text-blue-700 font-mono">#{row.restaurantId}</span>
          ) : null}
        </div>
      ),
    },
    { key: "date", label: "Failed Time" },
    {
      key: "paymentMode",
      label: "Payment",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          Failed ({row.paymentMode})
        </span>
      ),
    },
    {
      key: "total",
      label: "Total Amount",
      render: (row) => <span className="font-extrabold text-gray-900">₹{Number(row.total).toFixed(2)}</span>,
    },
  ];

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 bg-gradient-to-t from-gray-100 to-gray-50 min-h-screen space-y-4">
      <OrderFilterHeader
        title="Failed Orders"
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
        columns={failedOrdersColumns}
        data={filteredOrders}
        loading={loading}
        onView={(row) => navigate(`/view-order/${row.id}`)}
        emptyMessage="No failed orders found"
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

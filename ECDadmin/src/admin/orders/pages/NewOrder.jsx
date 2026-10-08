import React, { useState } from "react";
import { Visibility, Search, Refresh, DirectionsBike, DirectionsWalk, CalendarToday, FilterList, CheckCircle, Cancel, AccessTime, ShoppingBag } from "@mui/icons-material";
import OrderTable from "../components/OrderTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useAdminOrders } from "../../api/order.js";
import { mapOrdersToTableData } from "../../../utils/orderData.js";

export default function NewOrder() {
  const navigate = useNavigate();

  // Filter States
  const [timeRange, setTimeRange] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch real-time orders from DB via API with 5s polling
  const { orders, summary, loading, error, refetch } = useAdminOrders({
    status: statusFilter,
    timeRange: timeRange,
    search: searchTerm,
    orderType: orderTypeFilter,
    refreshInterval: 5000,
  });

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
      label: "View Order",
      render: (row) => (
        <button
          onClick={() => navigate(`/view-order/${row.id}`)}
          className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors flex items-center gap-1 font-medium text-xs"
        >
          <Visibility style={{ fontSize: 18 }} />
          <span>View</span>
        </button>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">{row.customerName}</p>
          <p className="text-xs text-gray-500 font-mono">
            {row.customerId ? <span className="text-emerald-700 font-semibold mr-1">#{row.customerId}</span> : null}
            {row.customerMobile || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "orderType",
      label: "Order Type",
      render: (row) => (
        <span
          className={`px-2.5 py-1 text-xs rounded-full font-semibold flex items-center gap-1 w-fit ${
            row.orderType === "Self Pickup"
              ? "bg-purple-100 text-purple-700 border border-purple-200"
              : "bg-blue-100 text-blue-700 border border-blue-200"
          }`}
        >
          {row.orderType === "Self Pickup" ? <DirectionsWalk style={{ fontSize: 14 }} /> : <DirectionsBike style={{ fontSize: 14 }} />}
          {row.orderType}
        </span>
      ),
    },
    {
      key: "restaurant",
      label: "Restaurant",
      render: (row) => (
        <div>
          <span className="font-medium text-gray-800 text-xs block">{row.restaurant}</span>
          {row.restaurantId ? (
            <span className="text-[10px] font-semibold text-blue-700 font-mono">#{row.restaurantId}</span>
          ) : null}
        </div>
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
      key: "deliveryPeople",
      label: "Rider",
      render: (row) => (
        <div>
          <span className="text-xs font-medium text-gray-700 block">{row.deliveryPeople}</span>
          {row.riderId && row.riderId !== "—" ? (
            <span className="text-[10px] font-semibold text-purple-700 font-mono">#{row.riderId}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "address",
      label: "Delivery Address",
      render: (row) => (
        <span className="text-xs text-gray-600 line-clamp-2 max-w-[200px]" title={row.address}>
          {row.address}
        </span>
      ),
    },
    {
      key: "paymentMode",
      label: "Payment",
      render: (row) => (
        <span
          className={`px-2.5 py-1 text-xs rounded-full font-semibold ${
            row.paymentMode === "COD"
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
          }`}
        >
          {row.paymentMode}
        </span>
      ),
    },
    {
      key: "total",
      label: "Total Amount",
      render: (row) => (
        <span className="font-bold text-emerald-700 text-sm">₹{row.total}</span>
      ),
    },
  ];

  const orderTableData = mapOrdersToTableData(orders);

  return (
    <div className="w-full px-6 py-4 bg-gray-50 min-h-screen">
      {/* Page Header with Real-Time Indicator */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <PageHeader
          title="All & Real-Time Orders"
          breadcrumbs={[
            { label: "Order Management" },
            { label: "Real-Time Orders", active: true },
          ]}
        />
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
          <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Live 5s DB Sync
          </span>
          <button
            onClick={() => refetch()}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            title="Refresh Orders Now"
          >
            <Refresh style={{ fontSize: 18 }} />
          </button>
        </div>
      </div>

      {/* Real-time Summary Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ShoppingBag />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Orders</p>
            <p className="text-lg font-bold text-gray-900">{summary.totalOrders || orders.length}</p>
            <p className="text-[10px] text-emerald-600 font-bold">₹{summary.totalRevenue || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AccessTime />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Active Orders</p>
            <p className="text-lg font-bold text-amber-600">{summary.activeCount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Delivered</p>
            <p className="text-lg font-bold text-emerald-600">{summary.deliveredCount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <Cancel />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Cancelled</p>
            <p className="text-lg font-bold text-rose-600">{summary.cancelledCount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <DirectionsWalk />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Self Pickup</p>
            <p className="text-lg font-bold text-purple-600">{summary.selfPickupCount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <CalendarToday />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Filter Range</p>
            <p className="text-sm font-bold text-emerald-800 uppercase">{timeRange}</p>
          </div>
        </div>
      </div>

      {/* Interactive Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          {/* Time Range Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mr-2">
              <CalendarToday style={{ fontSize: 14 }} /> Date Range:
            </span>
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Daily (Today)" },
              { id: "weekly", label: "Weekly (7 Days)" },
              { id: "monthly", label: "Monthly (30 Days)" },
              { id: "yearly", label: "Yearly" },
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  timeRange === range.id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 18 }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Order #, Name, Mobile, Rest..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Order Status Tabs */}
        <div className="flex items-center gap-2 border-t border-gray-100 pt-3 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mr-2">
            <FilterList style={{ fontSize: 14 }} /> Status Filter:
          </span>
          {[
            { id: "all", label: "All Statuses" },
            { id: "active", label: "Active Orders" },
            { id: "delivered", label: "Delivered" },
            { id: "cancelled", label: "Cancelled" },
            { id: "pickup", label: "Self Pickup Only" },
            { id: "failed", label: "Failed" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === st.id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <OrderTable
          columns={orderTableColumns}
          data={orderTableData}
          loading={loading}
        />
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold border-t border-red-100 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {!loading && orderTableData.length === 0 && (
          <div className="p-12 text-center">
            <ShoppingBag className="text-gray-300 mx-auto mb-3" style={{ fontSize: 48 }} />
            <p className="text-sm font-bold text-gray-700">No Orders Found</p>
            <p className="text-xs text-gray-500 mt-1">Try changing your filters, date range, or search term above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Divider,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Person,
  Storefront,
  TwoWheeler,
  LocationOn,
  AccessTime,
  Payment,
  Receipt,
  CheckCircle,
  Warning,
  ContentCopy,
  OpenInNew,
  Phone,
  Email,
  ArrowBack,
  Print,
  Fastfood,
  Schedule,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAdminOrderDetails } from "../../api/order";
import PageHeader from "../../components/PageHeader";
import { getName, getAddress } from "../../../utils/orderData";

// BRAND CONSTANTS
const BRAND_MAIN = "#ed2026";
const BRAND_BG_LIGHT = "#FFF5F2";

const formatIST = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return String(dateStr);
  }
};

const getStatusBadgeConfig = (statusStr) => {
  const status = (statusStr || "").toLowerCase();
  if (status.includes("cancel") || status.includes("failed")) {
    return {
      bg: "bg-rose-100",
      text: "text-rose-700",
      border: "border-rose-200",
      dot: "bg-rose-500",
      label: "CANCELLED",
    };
  }
  if (status.includes("deliver") || status.includes("complet")) {
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
      label: "DELIVERED",
    };
  }
  if (status.includes("picked") || status.includes("out_for") || status.includes("way")) {
    return {
      bg: "bg-indigo-100",
      text: "text-indigo-700",
      border: "border-indigo-200",
      dot: "bg-indigo-500",
      label: "PICKED UP",
    };
  }
  if (status.includes("ready")) {
    return {
      bg: "bg-teal-100",
      text: "text-teal-700",
      border: "border-teal-200",
      dot: "bg-teal-500",
      label: "READY",
    };
  }
  if (status.includes("assign")) {
    return {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-200",
      dot: "bg-blue-500",
      label: "ASSIGNED",
    };
  }
  if (status.includes("prepar")) {
    return {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-200",
      dot: "bg-purple-500",
      label: "PREPARING",
    };
  }
  if (status.includes("accept")) {
    return {
      bg: "bg-sky-100",
      text: "text-sky-700",
      border: "border-sky-200",
      dot: "bg-sky-500",
      label: "ACCEPTED",
    };
  }
  return {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "PENDING",
  };
};

const cleanId = (id, fallback) => {
  if (!id) return fallback;
  const str = String(id).trim();
  if (str.startsWith("REST_")) return "RNT001";
  return str.replace(/^#+/, "");
};

const ViewOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { order, loading, error, refetch } = useAdminOrderDetails(id);
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 2 }}>
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <Typography sx={{ color: BRAND_MAIN, fontWeight: "bold" }}>Loading live order details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 font-sans">
        <div className="max-w-xl mx-auto mt-16 bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center">
          <Warning className="text-red-500 mx-auto mb-3" sx={{ fontSize: 48 }} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to load order</h2>
          <p className="text-sm text-red-600 mb-6">{error}</p>
          <Button variant="contained" sx={{ bgcolor: BRAND_MAIN, "&:hover": { bgcolor: "#c41a1f" } }} onClick={() => navigate("/order-dashboard")}>
            Back to Live Orders
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 font-sans text-center">
        <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <p className="text-base text-gray-600 font-semibold mb-4">No order found with ID: {id}</p>
          <Button variant="outlined" onClick={() => navigate("/order-dashboard")}>
            Back to Live Orders
          </Button>
        </div>
      </div>
    );
  }

  // 1. Order ID
  const displayOrderId = order.orderNumber || order.orderId || (order._id ? `#ORD${order._id.slice(-4).toUpperCase()}` : "#ORD001");
  const cleanOrderNumber = displayOrderId.startsWith("#") ? displayOrderId : `#${displayOrderId}`;

  // 2. Customer Info
  const customerName = order.customer?.name || order.customerName || "Customer";
  const customerId = cleanId(order.customerId || order.customer?.customerId, "C001");
  const customerMobile = order.customer?.mobile || order.customer?.phone || order.customerPhone || "—";
  const customerEmail = order.customer?.email || order.customerEmail || "—";

  // 3. Restaurant Info
  const restaurantName = order.restaurant?.name ? getName(order.restaurant.name) : (order.restaurantName || "Restaurant");
  const restaurantId = cleanId(order.restaurantId || order.restaurant?.restaurantId, "RNT001");
  const restaurantPhone = order.restaurant?.phone || order.restaurant?.contactNumber || order.restaurantPhone || "—";
  const restaurantEmail = order.restaurant?.email || order.restaurantEmail || "—";
  const restaurantAddress = order.restaurant?.address ? getAddress(order.restaurant.address) : (order.restaurant?.city || "—");

  // 4. Rider Info
  const riderObj = order.rider;
  const isRiderAssigned = Boolean(riderObj || order.riderName || order.riderId);
  const riderName = riderObj?.name || riderObj?.user?.name || order.riderName || "Assigned Rider";
  const riderId = cleanId(order.riderId || riderObj?.riderId, "RDR001");
  const riderMobile = riderObj?.mobile || riderObj?.phone || riderObj?.user?.mobile || order.riderPhone || "—";
  const riderVehicle = riderObj?.vehicle?.number || (typeof riderObj?.vehicle === "string" ? riderObj.vehicle : (riderObj?.vehicle?.model ? `${riderObj.vehicle.model} (${riderObj.vehicle.number || ''})` : "—"));
  const riderStatus = riderObj?.isOnline ? "Online & Active" : (order.status === "assigned" ? "En Route to Store" : "Assigned");

  // 5. Location Details
  const deliveryAddressLine = order.deliveryAddress?.addressLine || (order.customer?.address ? getAddress(order.customer.address) : "Delivery address provided at checkout");
  const coordinates = Array.isArray(order.deliveryAddress?.coordinates) && order.deliveryAddress.coordinates.length === 2
    ? order.deliveryAddress.coordinates
    : (order.customer?.location?.coordinates || [77.2090, 28.6139]);
  const [lng, lat] = coordinates;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  // 6. Payment Info
  const paymentMethod = (order.paymentMethod || "COD").toUpperCase();
  const paymentStatus = (order.paymentStatus || "pending").toUpperCase();
  const isPaid = paymentStatus === "PAID";
  const transactionId = order.transactionId || order.stripePaymentIntentId || order.stripeSessionId || null;

  // 7. Status & Badge
  const statusCfg = getStatusBadgeConfig(order.status);
  const isPickup = order.orderType === "self_pickup" || order.orderType === "pickup";

  // 8. Timestamps
  const orderedAt = formatIST(order.createdAt);
  const updatedAt = formatIST(order.updatedAt);
  const deliveredAt = order.deliveredAt ? formatIST(order.deliveredAt) : null;
  const pickedUpAt = order.pickedUpAt ? formatIST(order.pickedUpAt) : null;

  // 9. Items
  const items = Array.isArray(order.items) ? order.items : [];

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(cleanOrderNumber.replace("#", ""));
    setCopied(true);
    toast.success("Order ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = (format = "A4") => {
    toast(`Opening ${format} print preview...`, { icon: "🖨️" });
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50/70 p-4 sm:p-6 lg:p-8 font-sans text-gray-700">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <PageHeader
            title="View Order Details"
            breadcrumbs={[
              { label: "Live Orders", href: "/order-dashboard" },
              { label: "View Order", active: true },
            ]}
          />
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/order-dashboard")}
            sx={{
              borderColor: "#e5e7eb",
              color: "#374151",
              "&:hover": { borderColor: "#d1d5db", bgcolor: "#f9fafb" },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            Live Orders
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Print />}
            onClick={() => handlePrint("A7")}
            sx={{
              borderColor: BRAND_MAIN,
              color: BRAND_MAIN,
              "&:hover": { bgcolor: BRAND_BG_LIGHT, borderColor: BRAND_MAIN },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            A7 Thermal
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Print />}
            onClick={() => handlePrint("A4")}
            sx={{
              bgcolor: BRAND_MAIN,
              "&:hover": { bgcolor: "#c41a1f" },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            A4 Invoice
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Left Content */}
        <div className="flex-1 space-y-6">
          {/* Main Order Header Card */}
          <Paper className="p-6 sm:p-8 shadow-sm border border-gray-100" sx={{ borderRadius: 3 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    {restaurantName}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusCfg.dot} animate-pulse`} />
                    {order.status || statusCfg.label}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <AccessTime sx={{ fontSize: 14 }} className="text-gray-400" />
                    Ordered: <strong className="text-gray-700">{orderedAt}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Updated: <strong className="text-gray-700">{updatedAt}</strong>
                  </span>
                </div>
              </div>

              {/* Order ID & Type */}
              <div className="text-left sm:text-right shrink-0">
                <div className="flex items-center sm:justify-end gap-1.5">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order ID</span>
                  <Tooltip title={copied ? "Copied!" : "Click to copy"}>
                    <button
                      onClick={handleCopyOrderId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-sm sm:text-base transition-colors"
                    >
                      {cleanOrderNumber}
                      <ContentCopy sx={{ fontSize: 13 }} className="text-gray-500" />
                    </button>
                  </Tooltip>
                </div>
                <div className="mt-2 flex items-center sm:justify-end gap-2">
                  <Chip
                    label={isPickup ? "Self Pickup 🛍️" : "Delivery 🚴"}
                    color={isPickup ? "secondary" : "primary"}
                    size="small"
                    sx={{ fontWeight: "bold" }}
                  />
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                      isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {paymentMethod} • {paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* 3-COLUMN DETAILS: Customer | Restaurant | Rider (All 3 Always Visible!) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              {/* 1. Customer Details */}
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100/80 hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold uppercase text-[11px] tracking-wider text-red-600 flex items-center gap-1">
                    <Person sx={{ fontSize: 16 }} /> Customer Details
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    #{customerId}
                  </span>
                </div>
                <div className="text-sm space-y-1.5">
                  <p className="font-bold text-gray-900 text-base">{customerName}</p>
                  <p className="text-gray-600 text-xs flex items-center gap-1.5">
                    <Phone sx={{ fontSize: 13 }} className="text-gray-400" />
                    {customerMobile !== "—" ? (
                      <a href={`tel:${customerMobile}`} className="hover:text-red-600 font-medium text-gray-700 underline decoration-dotted">
                        {customerMobile}
                      </a>
                    ) : (
                      "No mobile provided"
                    )}
                  </p>
                  <p className="text-gray-600 text-xs flex items-center gap-1.5 truncate">
                    <Email sx={{ fontSize: 13 }} className="text-gray-400" />
                    {customerEmail !== "—" ? (
                      <a href={`mailto:${customerEmail}`} className="hover:text-red-600 text-gray-700 truncate">
                        {customerEmail}
                      </a>
                    ) : (
                      "No email provided"
                    )}
                  </p>
                </div>
              </div>

              {/* 2. Restaurant Details */}
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100/80 hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold uppercase text-[11px] tracking-wider text-red-600 flex items-center gap-1">
                    <Storefront sx={{ fontSize: 16 }} /> Restaurant Details
                  </span>
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    #{restaurantId}
                  </span>
                </div>
                <div className="text-sm space-y-1.5">
                  <p className="font-bold text-gray-900 text-base">{restaurantName}</p>
                  <p className="text-gray-600 text-xs flex items-center gap-1.5">
                    <Phone sx={{ fontSize: 13 }} className="text-gray-400" />
                    {restaurantPhone !== "—" ? (
                      <a href={`tel:${restaurantPhone}`} className="hover:text-red-600 font-medium text-gray-700 underline decoration-dotted">
                        {restaurantPhone}
                      </a>
                    ) : (
                      "No phone provided"
                    )}
                  </p>
                  <p className="text-gray-500 text-xs line-clamp-2" title={restaurantAddress}>
                    {restaurantAddress}
                  </p>
                  {restaurantEmail !== "—" && (
                    <p className="text-gray-400 text-[11px] truncate">{restaurantEmail}</p>
                  )}
                </div>
              </div>

              {/* 3. Rider Details (Always present!) */}
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100/80 hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold uppercase text-[11px] tracking-wider text-red-600 flex items-center gap-1">
                    <TwoWheeler sx={{ fontSize: 16 }} /> Rider Details
                  </span>
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      isRiderAssigned ? "text-purple-700 bg-purple-100" : "text-amber-700 bg-amber-100"
                    }`}
                  >
                    #{isRiderAssigned ? riderId : "UNASSIGNED"}
                  </span>
                </div>
                {isRiderAssigned ? (
                  <div className="text-sm space-y-1.5">
                    <p className="font-bold text-gray-900 text-base">{riderName}</p>
                    <p className="text-gray-600 text-xs flex items-center gap-1.5">
                      <Phone sx={{ fontSize: 13 }} className="text-gray-400" />
                      {riderMobile !== "—" ? (
                        <a href={`tel:${riderMobile}`} className="hover:text-red-600 font-medium text-gray-700 underline decoration-dotted">
                          {riderMobile}
                        </a>
                      ) : (
                        "No phone provided"
                      )}
                    </p>
                    <p className="text-gray-600 text-xs flex items-center gap-1.5">
                      <TwoWheeler sx={{ fontSize: 13 }} className="text-gray-400" />
                      <span>{riderVehicle !== "—" ? `Vehicle: ${riderVehicle}` : "Vehicle details pending"}</span>
                    </p>
                    <p className="text-[11px] font-semibold text-purple-700">
                      Status: {riderStatus}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm space-y-2">
                    <p className="font-bold text-gray-800 text-sm">No Rider Assigned Yet</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {isPickup
                        ? "Customer selected self pickup. No rider required."
                        : "Order will be auto-dispatched or can be assigned by admin."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Location & Delivery Address Card */}
            <div className="mb-8 p-4 rounded-xl bg-blue-50/40 border border-blue-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg mt-0.5 shrink-0">
                  <LocationOn fontSize="small" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                    Delivery Location & Address
                  </h4>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    {deliveryAddressLine}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    GPS Coordinates: [{lat.toFixed(5)}, {lng.toFixed(5)}] • Contact: {customerMobile}
                  </p>
                </div>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 transition-all shrink-0 self-start sm:self-center shadow-xs"
              >
                <span>View on Map</span>
                <OpenInNew sx={{ fontSize: 13 }} />
              </a>
            </div>

            {/* Order Items Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                  <Fastfood sx={{ fontSize: 18 }} className="text-red-500" />
                  Order Items ({items.length})
                </h3>
              </div>

              <TableContainer component="div" className="border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                <Table>
                  <TableHead style={{ backgroundColor: BRAND_BG_LIGHT }}>
                    <TableRow>
                      <TableCell className="font-extrabold uppercase text-xs" style={{ color: BRAND_MAIN, width: 80 }}>Image</TableCell>
                      <TableCell className="font-extrabold uppercase text-xs" style={{ color: BRAND_MAIN }}>Item Name</TableCell>
                      <TableCell className="font-extrabold uppercase text-xs" style={{ color: BRAND_MAIN }}>Size / Variation</TableCell>
                      <TableCell className="font-extrabold uppercase text-xs" align="center" style={{ color: BRAND_MAIN }}>Qty</TableCell>
                      <TableCell className="font-extrabold uppercase text-xs" align="right" style={{ color: BRAND_MAIN }}>Price</TableCell>
                      <TableCell className="font-extrabold uppercase text-xs" align="right" style={{ color: BRAND_MAIN }}>Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" className="py-6 text-gray-400 text-sm">
                          No items in this order
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => {
                        const itemQty = Number(item.quantity || 1);
                        const itemPrice = Number(item.price || 0);
                        const lineTotal = itemQty * itemPrice;
                        const itemNameStr = item.name ? (typeof item.name === "string" ? item.name : getName(item.name)) : "Item";
                        const itemSize = item.size || item.variation?.name || "—";

                        return (
                          <TableRow key={index} sx={{ "&:last-child td": { border: 0 } }} hover>
                            <TableCell>
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={itemNameStr}
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400">
                                  <Fastfood sx={{ fontSize: 20 }} />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "#1f2937" }}>
                                {itemNameStr}
                              </Typography>
                              {Array.isArray(item.addOns) && item.addOns.length > 0 && (
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  Add-ons: {item.addOns.map((a) => a.name).join(", ")}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-600 font-medium text-xs">
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                                {itemSize}
                              </span>
                            </TableCell>
                            <TableCell align="center" className="font-extrabold text-gray-800 text-sm">
                              {itemQty}
                            </TableCell>
                            <TableCell align="right" className="font-semibold text-gray-700 text-sm">
                              ₹ {itemPrice.toFixed(2)}
                            </TableCell>
                            <TableCell align="right" className="font-extrabold text-gray-900 text-sm">
                              ₹ {lineTotal.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>

            {/* Payment & Amount Calculation Grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left: Payment & Financial Summary */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/80 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Payment sx={{ fontSize: 16 }} className="text-red-500" /> Payment & Transaction
                </h4>
                <div className="text-xs space-y-2 pt-1 text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Payment Method:</span>
                    <span className="font-bold text-gray-900 uppercase bg-gray-200/80 px-2 py-0.5 rounded">
                      {paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment Status:</span>
                    <span
                      className={`font-extrabold px-2 py-0.5 rounded ${
                        isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {paymentStatus}
                    </span>
                  </div>
                  {transactionId && (
                    <div className="flex justify-between items-center">
                      <span>Transaction Reference:</span>
                      <span className="font-mono text-gray-800 text-[11px] truncate max-w-[180px]">
                        {transactionId}
                      </span>
                    </div>
                  )}
                  {deliveredAt && (
                    <div className="flex justify-between items-center">
                      <span>Delivered Time:</span>
                      <span className="font-semibold text-emerald-700">{deliveredAt}</span>
                    </div>
                  )}
                  {order.cancellationReason && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      <strong>Cancellation Reason:</strong> {order.cancellationReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Amount Calculation Card */}
              <Paper elevation={0} sx={{ bgcolor: BRAND_BG_LIGHT, p: 4, borderRadius: 3, border: "1px solid #fee2e2" }}>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Item Total</span>
                    <span className="font-bold text-gray-900">₹ {Number(order?.itemTotal || 0).toFixed(2)}</span>
                  </div>
                  {Number(order?.packagingFee || order?.packing || 0) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Packaging Charge</span>
                      <span className="font-bold text-gray-900">₹ {Number(order?.packagingFee || order?.packing || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(order?.tax || 0) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>GST / Taxes</span>
                      <span className="font-bold text-gray-900">₹ {Number(order?.tax || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(order?.platformFee || 0) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Platform Fee</span>
                      <span className="font-bold text-gray-900">₹ {Number(order?.platformFee || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-gray-900">₹ {Number(order?.deliveryFee || 0).toFixed(2)}</span>
                  </div>
                  {Number(order?.tip || 0) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Rider Tip</span>
                      <span className="font-bold text-gray-900">₹ {Number(order?.tip || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(order?.discount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount {order?.couponCode ? `(${order.couponCode})` : ""}</span>
                      <span className="font-extrabold">- ₹ {Number(order?.discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <Divider sx={{ my: 1.5, borderColor: "#fecaca" }} />
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-bold text-gray-900">Grand Total</span>
                    <span className="font-black text-xl" style={{ color: BRAND_MAIN }}>
                      ₹ {Number(order?.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Paper>
            </div>

            {/* Order Timeline Milestones */}
            {Array.isArray(order.timeline) && order.timeline.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-1.5 mb-4">
                  <Schedule sx={{ fontSize: 16 }} className="text-red-500" /> Order Journey Timeline
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {order.timeline.map((step, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800 capitalize">
                          {step.label || step.status?.replace("_", " ")}
                        </span>
                        <CheckCircle sx={{ fontSize: 14 }} className="text-emerald-500" />
                      </div>
                      <p className="text-[11px] text-gray-500 leading-tight">
                        {step.description || "Milestone reached"}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono pt-0.5">
                        {formatIST(step.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Paper>
        </div>

        {/* Sidebar Actions */}
        <div className="w-full lg:w-72 space-y-4 shrink-0">
          <Paper className="p-4 shadow-sm border border-gray-100" sx={{ borderRadius: 3 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                toast.success("Order is live and synchronized with the mobile app!");
                refetch();
              }}
              sx={{
                bgcolor: BRAND_MAIN,
                "&:hover": { bgcolor: "#c41a1f" },
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 2,
                py: 1.2,
              }}
            >
              Sync & Refresh
            </Button>
          </Paper>

          <Paper className="p-5 shadow-sm border border-gray-100 space-y-3" sx={{ borderRadius: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary", display: "block" }}>
              PRINT INVOICE
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handlePrint("A7")}
              startIcon={<Print />}
              sx={{
                borderColor: BRAND_MAIN,
                color: BRAND_MAIN,
                "&:hover": { borderColor: "#c41a1f", bgcolor: BRAND_BG_LIGHT },
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 2,
                py: 1,
              }}
            >
              A7 Thermal Print
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handlePrint("A4")}
              startIcon={<Receipt />}
              sx={{
                borderColor: BRAND_MAIN,
                color: BRAND_MAIN,
                "&:hover": { borderColor: "#c41a1f", bgcolor: BRAND_BG_LIGHT },
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 2,
                py: 1,
              }}
            >
              A4 Document Print
            </Button>
          </Paper>

          {/* Quick Info Box */}
          <Paper className="p-5 shadow-sm border border-gray-100 bg-gray-50/60" sx={{ borderRadius: 3 }}>
            <h5 className="font-bold text-xs uppercase text-gray-600 mb-2">Live Order Status</h5>
            <div className="text-xs space-y-1.5 text-gray-500">
              <p>Type: <strong className="text-gray-800">{isPickup ? "Self Pickup" : "Doorstep Delivery"}</strong></p>
              <p>Items: <strong className="text-gray-800">{items.length} item(s)</strong></p>
              <p>Total: <strong className="text-gray-800">₹{Number(order?.totalAmount || 0).toFixed(2)}</strong></p>
              <p>Rider: <strong className="text-gray-800">{isRiderAssigned ? riderName : "Not Assigned"}</strong></p>
            </div>
          </Paper>
        </div>
      </div>
    </div>
  );
};

export default ViewOrder;
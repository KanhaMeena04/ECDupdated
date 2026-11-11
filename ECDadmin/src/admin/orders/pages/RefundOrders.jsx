import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  CheckCircleOutline,
  CancelOutlined,
  Rule,
  ReceiptLong,
  History,
  Save,
  Refresh,
} from "@mui/icons-material";
import OrderTable from "../components/OrderTable";
import OrderFilterHeader from "../components/OrderFilterHeader";
import { useAdminOrders } from "../../api/order.js";
import { mapRefundOrders } from "../../../utils/orderData.js";
import { API_BASE_URL } from "../../../utils/utils";

const REASON_LABELS = {
  customer: "Customer Cancelled",
  restaurant: "Restaurant Rejected / Cancelled",
  timeout: "System Acceptance Timeout",
  rider_unavailable: "Rider Unavailable / Cancelled",
  food_unavailable: "Food / Item Out of Stock",
  technical: "Technical / Payment Failure",
};

const AUTO_REASON_OPTIONS = [
  "payment_failure",
  "timeout",
  "technical",
  "restaurant",
  "food_unavailable",
  "rider_unavailable",
  "customer",
];

const DEFAULT_RULES = {
  customer: { refundPercent: 100, preparingRefundPercent: 50, restaurantPayablePercent: 0, platformLossPercent: 100 },
  restaurant: { refundPercent: 100, restaurantPayablePercent: 0, platformLossPercent: 100 },
  timeout: { refundPercent: 100, restaurantPayablePercent: 0, platformLossPercent: 100 },
  rider_unavailable: { refundPercent: 100, restaurantPayablePercent: 50, platformLossPercent: 50 },
  food_unavailable: { refundPercent: 100, restaurantPayablePercent: 0, platformLossPercent: 100 },
  technical: { refundPercent: 100, restaurantPayablePercent: 0, platformLossPercent: 100 },
};

export default function RefundOrders() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "rules" ? 1 : searchParams.get("tab") === "history" ? 2 : 0;
  const [activeTab, setActiveTab] = useState(initialTab);

  // Tab 1: Refund Ledger (RefundRequest)
  const [ledgerStatus, setLedgerStatus] = useState("all");
  const [ledgerReason, setLedgerReason] = useState("all");
  const [refunds, setRefunds] = useState([]);
  const [summary, setSummary] = useState({
    pendingCount: 0,
    processedCount: 0,
    rejectedCount: 0,
    totalRefundAmount: 0,
    totalRestaurantLiability: 0,
    totalPlatformLoss: 0,
  });
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Approve / Reject Modal
  const [actionModal, setActionModal] = useState({ open: false, type: "", item: null });
  const [actionNote, setActionNote] = useState("");
  const [gatewayTxnId, setGatewayTxnId] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("wallet");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Tab 2: Reason-Wise Refund Rules
  const [refundConfig, setRefundConfig] = useState({
    mode: "manual",
    autoRefundReasons: ["payment_failure", "timeout", "technical"],
    reasonRules: DEFAULT_RULES,
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Tab 3: Refunded Orders History
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [timeRange, setTimeRange] = useState("all");

  const { orders, loading, error, refetch } = useAdminOrders({
    status: "refunded",
    date: selectedDate,
    timeRange,
    search: searchQuery,
  });

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "rules") setActiveTab(1);
    else if (tabParam === "history") setActiveTab(2);
  }, [searchParams]);

  const fetchRefundLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/admin/refunds`, {
        params: { status: ledgerStatus, reason: ledgerReason, limit: 100 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefunds(res.data?.refunds || []);
      if (res.data?.summary) setSummary(res.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load refund ledger");
    } finally {
      setLedgerLoading(false);
    }
  }, [ledgerStatus, ledgerReason]);

  const fetchRefundConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/admin/refund-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cfg = res.data?.refundConfig || res.data?.config || res.data?.data || {};
      setRefundConfig({
        mode: cfg.mode || "manual",
        autoRefundReasons: Array.isArray(cfg.autoRefundReasons)
          ? cfg.autoRefundReasons
          : ["payment_failure", "timeout", "technical"],
        reasonRules: {
          ...DEFAULT_RULES,
          ...(cfg.reasonRules || {}),
        },
      });
    } catch (err) {
      toast.error("Failed to fetch reason-wise refund rules");
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefundLedger();
    fetchRefundConfig();
  }, [fetchRefundLedger, fetchRefundConfig]);

  const handleSaveRefundConfig = async () => {
    setSavingConfig(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/api/admin/refund-config`, refundConfig, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Reason-wise refund rules saved & audited!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save refund rules");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRuleFieldChange = (reasonKey, field, val) => {
    const num = Math.max(0, Math.min(100, Number(val || 0)));
    setRefundConfig((prev) => ({
      ...prev,
      reasonRules: {
        ...prev.reasonRules,
        [reasonKey]: {
          ...(prev.reasonRules[reasonKey] || {}),
          [field]: num,
        },
      },
    }));
  };

  const toggleAutoReason = (key) => {
    setRefundConfig((prev) => {
      const exists = prev.autoRefundReasons.includes(key);
      return {
        ...prev,
        autoRefundReasons: exists
          ? prev.autoRefundReasons.filter((r) => r !== key)
          : [...prev.autoRefundReasons, key],
      };
    });
  };

  const handleConfirmAction = async () => {
    if (!actionModal.item) return;
    setActionSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const id = actionModal.item._id;
      if (actionModal.type === "approve") {
        await axios.post(
          `${API_BASE_URL}/api/admin/refunds/${id}/approve`,
          { note: actionNote, gatewayTransactionId: gatewayTxnId, payoutMethod },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Refund approved & processed!");
      } else {
        await axios.post(
          `${API_BASE_URL}/api/admin/refunds/${id}/reject`,
          { note: actionNote || "Rejected by Admin" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Refund request rejected!");
      }
      setActionModal({ open: false, type: "", item: null });
      setActionNote("");
      setGatewayTxnId("");
      fetchRefundLedger();
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionSubmitting(false);
    }
  };

  const refundOrdersData = useMemo(() => mapRefundOrders(orders), [orders]);

  const filteredOrders = useMemo(() => {
    let list = refundOrdersData;
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
  }, [refundOrdersData, searchQuery, selectedDate]);

  const refundOrdersColumns = [
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
    { key: "date", label: "Refund Date" },
    {
      key: "paymentMode",
      label: "Status",
      render: () => (
        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          Refunded
        </span>
      ),
    },
    {
      key: "total",
      label: "Refunded Amount",
      render: (row) => <span className="font-extrabold text-amber-700">₹{Number(row.total).toFixed(2)}</span>,
    },
  ];

  const handleTabChange = (_, v) => {
    setActiveTab(v);
    if (v === 1) setSearchParams({ tab: "rules" });
    else if (v === 2) setSearchParams({ tab: "history" });
    else setSearchParams({});
  };

  return (
    <Box className="w-full p-4 sm:p-6 bg-gray-50 min-h-screen">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827" }}>
            Refund & Cancellation Ledger Control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reason-wise refund rules, customer/restaurant/platform liability split, approval workflow & audit logs.
          </Typography>
        </div>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => {
            fetchRefundLedger();
            fetchRefundConfig();
            refetch();
          }}
        >
          Refresh All
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>PENDING REQUESTS</Typography>
              <Typography variant="h5" fontWeight={800} color="warning.main">{summary.pendingCount || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>PROCESSED REFUNDS</Typography>
              <Typography variant="h5" fontWeight={800} color="success.main">{summary.processedCount || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL REFUNDED</Typography>
              <Typography variant="h5" fontWeight={800}>₹{Number(summary.totalRefundAmount || 0).toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>RESTAURANT LIABILITY</Typography>
              <Typography variant="h5" fontWeight={800} color="info.main">₹{Number(summary.totalRestaurantLiability || 0).toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>PLATFORM LOSS</Typography>
              <Typography variant="h5" fontWeight={800} color="error.main">₹{Number(summary.totalPlatformLoss || 0).toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 2, borderRadius: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
          <Tab icon={<ReceiptLong />} iconPosition="start" label="Refund Ledger & Approvals" />
          <Tab icon={<Rule />} iconPosition="start" label="Reason-Wise Refund Rules" />
          <Tab icon={<History />} iconPosition="start" label="Refunded Orders History" />
        </Tabs>
      </Paper>

      {/* TAB 0: REFUND LEDGER */}
      {activeTab === 0 && (
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select value={ledgerStatus} label="Status" onChange={(e) => setLedgerStatus(e.target.value)}>
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending Approval</MenuItem>
                <MenuItem value="processed">Processed</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Reason Category</InputLabel>
              <Select value={ledgerReason} label="Reason Category" onChange={(e) => setLedgerReason(e.target.value)}>
                <MenuItem value="all">All Reasons</MenuItem>
                <MenuItem value="Customer">Customer</MenuItem>
                <MenuItem value="Restaurant">Restaurant</MenuItem>
                <MenuItem value="Timeout">Timeout</MenuItem>
                <MenuItem value="Rider unavailable">Rider unavailable</MenuItem>
                <MenuItem value="Food unavailable">Food unavailable</MenuItem>
                <MenuItem value="Technical">Technical</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {ledgerLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f9fafb" }}>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Reason & Details</TableCell>
                    <TableCell>Financial Split</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {refunds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No refund ledger requests found for selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    refunds.map((r) => (
                      <TableRow key={r._id} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ cursor: "pointer", color: "#248C70" }}
                            onClick={() => r.order?._id && navigate(`/view-order/${r.order._id}`)}
                          >
                            #{r.order?.orderNumber || r.order?.orderId || r.order?._id?.slice(-6) || "N/A"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {r.restaurant?.name || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{r.user?.name || "Customer"}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.user?.mobile || r.user?.phone || "—"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={r.reason || "Other"} size="small" color="info" variant="outlined" sx={{ mb: 0.5 }} />
                          <Typography variant="caption" display="block" color="text.secondary">
                            {r.cancellationDetails || r.order?.cancellationReason || r.note || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="success.main">
                            Refund: ₹{Number(r.refundAmount || r.amount || 0).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Rest Liability: ₹{Number(r.restaurantPayableShare || 0).toFixed(2)} | Platform Loss: ₹{Number(r.platformLoss || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={(r.method || "wallet").toUpperCase()} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={(r.status || "pending").toUpperCase()}
                            size="small"
                            color={
                              r.status === "processed" || r.status === "approved"
                                ? "success"
                                : r.status === "rejected"
                                ? "error"
                                : "warning"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {r.status === "pending" ? (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleOutline />}
                                onClick={() => {
                                  setPayoutMethod(r.method || "wallet");
                                  setActionNote("");
                                  setGatewayTxnId("");
                                  setActionModal({ open: true, type: "approve", item: r });
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<CancelOutlined />}
                                onClick={() => {
                                  setActionNote("");
                                  setActionModal({ open: true, type: "reject", item: r });
                                }}
                              >
                                Reject
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {r.processedBy?.name ? `By ${r.processedBy.name}` : "Done"}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* TAB 1: REASON-WISE RULES */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          {configLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
                <div>
                  <Typography variant="h6" fontWeight={700}>Auto vs Manual Refund Mode & Reason-Wise Split</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configure customer refund %, restaurant liability %, and platform loss % per cancellation reason. Every save is recorded in Audit Logs.
                  </Typography>
                </div>
                <FormControlLabel
                  control={
                    <Switch
                      checked={refundConfig.mode === "auto"}
                      onChange={(e) => setRefundConfig((prev) => ({ ...prev, mode: e.target.checked ? "auto" : "manual" }))}
                      color="success"
                    />
                  }
                  label={refundConfig.mode === "auto" ? "Mode: AUTO-REFUND ON" : "Mode: MANUAL APPROVAL"}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Auto-Refund Eligible Reasons (when Mode = AUTO):
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {AUTO_REASON_OPTIONS.map((key) => {
                    const selected = refundConfig.autoRefundReasons.includes(key);
                    return (
                      <Chip
                        key={key}
                        label={key}
                        clickable
                        color={selected ? "success" : "default"}
                        variant={selected ? "filled" : "outlined"}
                        onClick={() => toggleAutoReason(key)}
                      />
                    );
                  })}
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f9fafb" }}>
                    <TableRow>
                      <TableCell>Cancellation Reason</TableCell>
                      <TableCell>Customer Refund (%)</TableCell>
                      <TableCell>While Preparing Refund (%)</TableCell>
                      <TableCell>Restaurant Liability (%)</TableCell>
                      <TableCell>Platform Loss (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(REASON_LABELS).map((key) => {
                      const row = refundConfig.reasonRules[key] || {};
                      return (
                        <TableRow key={key}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{REASON_LABELS[key]}</Typography>
                            <Typography variant="caption" color="text.secondary">{key}</Typography>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              sx={{ width: 100 }}
                              value={row.refundPercent ?? 100}
                              onChange={(e) => handleRuleFieldChange(key, "refundPercent", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            {key === "customer" ? (
                              <TextField
                                type="number"
                                size="small"
                                sx={{ width: 100 }}
                                value={row.preparingRefundPercent ?? 50}
                                onChange={(e) => handleRuleFieldChange(key, "preparingRefundPercent", e.target.value)}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">N/A</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              sx={{ width: 100 }}
                              value={row.restaurantPayablePercent ?? 0}
                              onChange={(e) => handleRuleFieldChange(key, "restaurantPayablePercent", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              sx={{ width: 100 }}
                              value={row.platformLossPercent ?? 100}
                              onChange={(e) => handleRuleFieldChange(key, "platformLossPercent", e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  disabled={savingConfig}
                  onClick={handleSaveRefundConfig}
                  sx={{ bgcolor: "#248C70", "&:hover": { bgcolor: "#1e755d" } }}
                >
                  {savingConfig ? "Saving..." : "Save Refund Rules"}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* TAB 2: REFUNDED ORDERS HISTORY */}
      {activeTab === 2 && (
        <Box className="space-y-4">
          <OrderFilterHeader
            title="Refunded Orders History"
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
            columns={refundOrdersColumns}
            data={filteredOrders}
            loading={loading}
            onView={(row) => navigate(`/view-order/${row.id}`)}
            emptyMessage="No refunded orders found"
            onResetFilters={() => {
              setSearchQuery("");
              setSelectedDate("");
              setTimeRange("all");
            }}
          />
          {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
        </Box>
      )}

      {/* Approve / Reject Dialog */}
      <Dialog open={actionModal.open} onClose={() => setActionModal({ open: false, type: "", item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>
          {actionModal.type === "approve" ? "Approve & Process Refund" : "Reject Refund Request"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {actionModal.type === "approve" && (
            <>
              <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                <InputLabel>Refund Method</InputLabel>
                <Select value={payoutMethod} label="Refund Method" onChange={(e) => setPayoutMethod(e.target.value)}>
                  <MenuItem value="wallet">Credit Customer Wallet</MenuItem>
                  <MenuItem value="gateway">Original Payment Gateway</MenuItem>
                </Select>
              </FormControl>
              {payoutMethod === "gateway" && (
                <TextField
                  label="Gateway Refund Txn ID (Optional)"
                  size="small"
                  fullWidth
                  value={gatewayTxnId}
                  onChange={(e) => setGatewayTxnId(e.target.value)}
                />
              )}
            </>
          )}
          <TextField
            label={actionModal.type === "approve" ? "Admin Note (Optional)" : "Rejection Reason"}
            size="small"
            multiline
            rows={2}
            fullWidth
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionModal({ open: false, type: "", item: null })}>Cancel</Button>
          <Button
            variant="contained"
            color={actionModal.type === "approve" ? "success" : "error"}
            disabled={actionSubmitting}
            onClick={handleConfirmAction}
          >
            {actionSubmitting ? "Processing..." : actionModal.type === "approve" ? "Confirm Approve" : "Confirm Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

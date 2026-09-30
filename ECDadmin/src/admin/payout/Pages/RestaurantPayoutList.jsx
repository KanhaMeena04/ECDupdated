import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Wallet,
  Store,
  Phone,
  AlertCircle,
  Eye,
  Sliders,
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  Layers
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { API_BASE_URL } from "../../../utils/utils";
import { toast } from "react-hot-toast";

export default function RestaurantPayoutList() {
  const [activeTab, setActiveTab] = useState("requests"); // 'requests' | 'ledger'

  // Payout Requests states
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [errorRequests, setErrorRequests] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");

  // Ledger states
  const [ledgers, setLedgers] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState({});
  const [loadingLedgers, setLoadingLedgers] = useState(false);
  const [errorLedgers, setErrorLedgers] = useState(null);
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState("");
  const [cycleFilter, setCycleFilter] = useState("");

  // Common UI states
  const [copiedId, setCopiedId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");

  // Modal states for Requests
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestModalType, setRequestModalType] = useState(null); // 'approve' | 'reject' | 'details'
  const [paidVia, setPaidVia] = useState("upi");
  const [adminNote, setAdminNote] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [processing, setProcessing] = useState(false);

  // Modal states for Ledger
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const [selectedRestaurantForCycle, setSelectedRestaurantForCycle] = useState(null);
  const [newCycleValue, setNewCycleValue] = useState("T+2");

  // Fetch Restaurant Payout Requests
  const fetchPayoutRequests = async () => {
    try {
      setLoadingRequests(true);
      setErrorRequests(null);
      const token = localStorage.getItem("token");
      const url = `${API_BASE_URL}/api/admin/withdrawals?requestType=restaurant${
        requestStatusFilter !== "all" ? `&status=${requestStatusFilter}` : ""
      }`;
      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });
      if (res.data?.withdrawals) {
        setRequests(res.data.withdrawals);
      } else if (Array.isArray(res.data)) {
        setRequests(res.data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Error fetching restaurant payout requests:", err);
      setErrorRequests(
        err.response?.data?.message || err.message || "Failed to load restaurant payout requests"
      );
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch Settlement Ledgers
  const fetchSettlements = async () => {
    try {
      setLoadingLedgers(true);
      setErrorLedgers(null);
      const token = localStorage.getItem("token");
      const params = {};
      if (ledgerStatusFilter) params.status = ledgerStatusFilter;
      if (cycleFilter) params.cycle = cycleFilter;

      const res = await axios.get(`${API_BASE_URL}/api/settlements/restaurants`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });

      if (res.data.ledgers) {
        setLedgers(res.data.ledgers);
      }
      if (res.data.summary) {
        setLedgerSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Error fetching settlement ledgers:", err);
      setErrorLedgers(err.response?.data?.message || err.message || "Failed to fetch settlement ledgers");
    } finally {
      setLoadingLedgers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "requests") {
      fetchPayoutRequests();
    } else {
      fetchSettlements();
    }
  }, [activeTab, requestStatusFilter, ledgerStatusFilter, cycleFilter]);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Approve Payout Request
  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    try {
      setProcessing(true);
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/withdrawals/${selectedRequest._id}/approve`,
        {
          adminNote,
          utrNumber,
          paidVia,
          paidToDetails: {
            method: paidVia,
            upiId: selectedRequest.bankDetails?.upiId || "",
            accountNumber: selectedRequest.bankDetails?.accountNumber || "",
            ifsc: selectedRequest.bankDetails?.ifsc || "",
            bankName: selectedRequest.bankDetails?.bankName || "",
            accountHolder: selectedRequest.bankDetails?.accountHolder || ""
          }
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );
      if (res.data.success) {
        toast.success("Payout approved & wallet updated!");
        setActionSuccess("Restaurant payout request approved & notification dispatched!");
        setTimeout(() => setActionSuccess(""), 4000);
        closeRequestModal();
        fetchPayoutRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve payout request");
    } finally {
      setProcessing(false);
    }
  };

  // Reject Payout Request
  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    try {
      setProcessing(true);
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/withdrawals/${selectedRequest._id}/reject`,
        { reason: adminNote || "Rejected by admin" },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );
      if (res.data.success) {
        toast.success("Payout request rejected");
        setActionSuccess("Payout request rejected");
        setTimeout(() => setActionSuccess(""), 3000);
        closeRequestModal();
        fetchPayoutRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject payout request");
    } finally {
      setProcessing(false);
    }
  };

  // Update Ledger Status
  const handleUpdateLedgerStatus = async (ledgerId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${API_BASE_URL}/api/settlements/${ledgerId}/status`,
        { status: newStatus },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data.success) {
        toast.success(`Settlement status updated to ${newStatus}`);
        fetchSettlements();
        if (selectedLedger && selectedLedger._id === ledgerId) {
          setSelectedLedger({ ...selectedLedger, status: newStatus });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update settlement status");
    }
  };

  // Sync Completed Orders into Ledgers
  const handleSyncOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/settlements/sync-orders`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Orders synced successfully");
        fetchSettlements();
      }
    } catch (err) {
      toast.error("Failed to sync orders");
    }
  };

  // Update Restaurant Settlement Cycle
  const handleSaveSettlementCycle = async () => {
    if (!selectedRestaurantForCycle) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/api/settlements/restaurants/${selectedRestaurantForCycle._id}/cycle`,
        { settlementCycle: newCycleValue },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data.success) {
        toast.success(`Settlement cycle set to ${newCycleValue}`);
        setCycleModalOpen(false);
        fetchSettlements();
      }
    } catch (err) {
      toast.error("Failed to update settlement cycle");
    }
  };

  const openRequestModal = (req, type) => {
    setSelectedRequest(req);
    setRequestModalType(type);
    setPaidVia(req.method === "bank" || (!req.bankDetails?.upiId && req.bankDetails?.accountNumber) ? "bank" : "upi");
    setAdminNote("");
    setUtrNumber("");
  };

  const closeRequestModal = () => {
    setSelectedRequest(null);
    setRequestModalType(null);
    setAdminNote("");
    setUtrNumber("");
  };

  // Filter requests based on search query
  const filteredRequests = requests.filter((r) => {
    const name = r.restaurantProfile?.name || r.bankDetails?.accountHolder || r.user?.name || "";
    const phone = r.bankDetails?.phone || r.restaurantProfile?.contactNumber || r.user?.mobile || "";
    const restId = r.restaurantDisplayId || r.restaurant?._id || "";
    const upi = r.bankDetails?.upiId || "";
    const accNum = r.bankDetails?.accountNumber || "";
    const ifsc = r.bankDetails?.ifsc || "";
    const query = searchQuery.toLowerCase();

    return (
      name.toLowerCase().includes(query) ||
      phone.toLowerCase().includes(query) ||
      restId.toLowerCase().includes(query) ||
      upi.toLowerCase().includes(query) ||
      accNum.toLowerCase().includes(query) ||
      ifsc.toLowerCase().includes(query)
    );
  });

  // Calculate Request KPIs
  const totalReqCount = requests.length;
  const pendingReqCount = requests.filter((r) => r.status === "pending").length;
  const approvedReqCount = requests.filter((r) => r.status === "approved" || r.status === "processed").length;
  const rejectedReqCount = requests.filter((r) => r.status === "rejected").length;
  const totalPendingReqAmount = requests
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalPaidReqAmount = requests
    .filter((r) => r.status === "approved" || r.status === "processed")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const getStatusColorClass = (status) => {
    switch (status) {
      case "CALCULATED": return "bg-gray-100 text-gray-700 border-gray-300";
      case "REVIEW": return "bg-amber-100 text-amber-800 border-amber-300";
      case "APPROVED": return "bg-blue-100 text-blue-800 border-blue-300";
      case "PROCESSING": return "bg-purple-100 text-purple-800 border-purple-300";
      case "PAID": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "RECONCILED": return "bg-teal-100 text-teal-800 border-teal-300";
      case "PAYMENT_FAILED": return "bg-rose-100 text-rose-800 border-rose-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Restaurant Settlement & Payout Engine"
          breadcrumbs={[
            { label: "Payouts", active: false },
            { label: "Restaurant Settlement Screen", active: true }
          ]}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={activeTab === "requests" ? fetchPayoutRequests : fetchSettlements}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm cursor-pointer"
          >
            <RefreshCw
              size={16}
              className={(loadingRequests || loadingLedgers) ? "animate-spin text-emerald-600" : "text-gray-500"}
            />
            Refresh
          </button>

          {activeTab === "ledger" && (
            <button
              onClick={handleSyncOrders}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm cursor-pointer"
            >
              <TrendingUp size={16} />
              Sync Completed Orders
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Toggle Tabs */}
      <div className="flex items-center border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "requests"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Wallet size={18} />
          Restaurant Payout Requests
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'requests' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
            {totalReqCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "ledger"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FileText size={18} />
          Settlement Ledger Engine
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'ledger' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
            {ledgers.length}
          </span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle className="text-emerald-600" size={20} />
          <span className="font-medium text-sm">{actionSuccess}</span>
        </div>
      )}

      {/* TAB 1: RESTAURANT PAYOUT REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Requests</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalReqCount}</h3>
                <span className="text-xs text-gray-500 font-medium">All time payout tickets</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Store size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Pending Approval</p>
                <h3 className="text-2xl font-bold text-amber-700 mt-1">{pendingReqCount}</h3>
                <span className="text-xs font-semibold text-amber-600">₹{totalPendingReqAmount.toLocaleString()} Pending</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Approved & Paid</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-1">{approvedReqCount}</h3>
                <span className="text-xs font-semibold text-emerald-600">₹{totalPaidReqAmount.toLocaleString()} Disbursed</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Rejected Requests</p>
                <h3 className="text-2xl font-bold text-rose-700 mt-1">{rejectedReqCount}</h3>
                <span className="text-xs text-rose-500 font-medium">Requires restaurant review</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <XCircle size={24} />
              </div>
            </div>
          </div>

          {/* Table Container Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {/* Controls Bar */}
            <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full md:w-auto">
                {[
                  { label: "All Requests", value: "all", count: totalReqCount },
                  { label: "Pending", value: "pending", count: pendingReqCount },
                  { label: "Approved", value: "approved", count: approvedReqCount },
                  { label: "Rejected", value: "rejected", count: rejectedReqCount }
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setRequestStatusFilter(tab.value)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      requestStatusFilter === tab.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        requestStatusFilter === tab.value
                          ? "bg-gray-100 text-gray-800"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="text"
                  placeholder="Search restaurant name, phone, UPI, A/C..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loadingRequests ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <RefreshCw className="animate-spin text-emerald-600 mb-3" size={32} />
                  <p className="text-gray-500 text-sm font-medium">Fetching restaurant payout requests...</p>
                </div>
              ) : errorRequests ? (
                <div className="py-16 text-center">
                  <AlertCircle className="text-rose-500 mx-auto mb-3" size={36} />
                  <p className="text-rose-600 font-semibold">{errorRequests}</p>
                  <button
                    onClick={fetchPayoutRequests}
                    className="mt-3 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <Store size={28} />
                  </div>
                  <h4 className="text-base font-semibold text-gray-700">No Restaurant Payout Requests Found</h4>
                  <p className="text-gray-400 text-xs mt-1">
                    {searchQuery
                      ? "Try searching with a different restaurant name or mobile number."
                      : "When restaurants request payout from their app, requests will appear here."}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                      <th className="py-3.5 px-4">#</th>
                      <th className="py-3.5 px-4">Restaurant Details</th>
                      <th className="py-3.5 px-4">Restaurant ID / Phone</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Bank Details (A/C & IFSC)</th>
                      <th className="py-3.5 px-4">UPI ID</th>
                      <th className="py-3.5 px-4">Wallet Balance</th>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRequests.map((req, idx) => {
                      const restName =
                        req.restaurantProfile?.name ||
                        req.bankDetails?.accountHolder ||
                        req.user?.name ||
                        "Restaurant Partner";
                      const restPhone =
                        req.bankDetails?.phone ||
                        req.restaurantProfile?.contactNumber ||
                        req.user?.mobile ||
                        "N/A";
                      const restDisplayId =
                        req.restaurantDisplayId ||
                        (req.restaurant?._id ? `REST-${req.restaurant._id.slice(-6).toUpperCase()}` : null) ||
                        (req.user?._id ? `USR-${req.user._id.slice(-6).toUpperCase()}` : "N/A");
                      const upiId = req.bankDetails?.upiId || req.user?.upi || "";
                      const accNum = req.bankDetails?.accountNumber || "";
                      const ifsc = req.bankDetails?.ifsc || "";
                      const bankName = req.bankDetails?.bankName || "";
                      const accHolder = req.bankDetails?.accountHolder || restName;

                      const isPending = req.status === "pending";
                      const isApproved = req.status === "approved" || req.status === "processed";
                      const isRejected = req.status === "rejected";

                      return (
                        <tr key={req._id} className="hover:bg-gray-50/80 transition group">
                          <td className="py-4 px-4 text-gray-400 text-xs font-medium">{idx + 1}</td>

                          {/* Restaurant Name & Logo */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {req.restaurantProfile?.logo ? (
                                <img
                                  src={req.restaurantProfile.logo}
                                  alt={restName}
                                  className="w-9 h-9 rounded-xl object-cover border border-gray-200 shadow-sm"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-sm shadow-sm">
                                  {restName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-gray-900 block leading-tight">
                                  {restName}
                                </span>
                                <span className="text-[11px] text-gray-400 block mt-0.5">
                                  {req.restaurantProfile?.email || req.user?.email || "Restaurant"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* ID & Phone */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <span className="inline-block bg-slate-100 text-slate-700 font-mono text-xs px-2 py-0.5 rounded-md font-semibold border border-slate-200">
                                {restDisplayId}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                                <Phone size={12} className="text-gray-400" />
                                <span>{restPhone}</span>
                              </div>
                            </div>
                          </td>

                          {/* Requested Amount */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-base text-gray-900 flex items-center gap-0.5">
                              <span>₹</span>
                              <span>{Number(req.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-semibold uppercase bg-emerald-50 px-1.5 py-0.5 rounded">
                              Pref: {req.method || "UPI"}
                            </span>
                          </td>

                          {/* Bank Details */}
                          <td className="py-4 px-4">
                            {accNum ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                    {accNum}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(accNum, `acc_${req._id}`)}
                                    title="Copy Account Number"
                                    className="p-1 text-gray-400 hover:text-emerald-600 rounded hover:bg-gray-100 transition cursor-pointer"
                                  >
                                    {copiedId === `acc_${req._id}` ? (
                                      <Check size={13} className="text-emerald-600" />
                                    ) : (
                                      <Copy size={13} />
                                    )}
                                  </button>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-gray-500 font-mono">
                                  <span>IFSC: {ifsc || "N/A"}</span>
                                  {ifsc && (
                                    <button
                                      onClick={() => handleCopy(ifsc, `ifsc_${req._id}`)}
                                      title="Copy IFSC"
                                      className="text-gray-400 hover:text-emerald-600 cursor-pointer"
                                    >
                                      {copiedId === `ifsc_${req._id}` ? (
                                        <Check size={11} className="text-emerald-600" />
                                      ) : (
                                        <Copy size={11} />
                                      )}
                                    </button>
                                  )}
                                </div>
                                {bankName && (
                                  <span className="text-[10px] text-gray-400 block">
                                    {bankName} {accHolder ? `(${accHolder})` : ""}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Not Provided</span>
                            )}
                          </td>

                          {/* UPI ID */}
                          <td className="py-4 px-4">
                            {upiId ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-semibold text-gray-800 bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200 max-w-[160px] truncate">
                                  {upiId}
                                </span>
                                <button
                                  onClick={() => handleCopy(upiId, `upi_${req._id}`)}
                                  title="Copy UPI ID"
                                  className="p-1 text-gray-400 hover:text-emerald-600 rounded hover:bg-gray-100 transition cursor-pointer"
                                >
                                  {copiedId === `upi_${req._id}` ? (
                                    <Check size={13} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Not Provided</span>
                            )}
                          </td>

                          {/* Wallet Balance */}
                          <td className="py-4 px-4">
                            <span className="text-xs font-semibold text-gray-700">
                              ₹{Number(req.walletBalance || 0).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-gray-400 block">Available Balance</span>
                          </td>

                          {/* Date & Time */}
                          <td className="py-4 px-4 text-xs text-gray-500">
                            <div className="font-medium text-gray-700">
                              {new Date(req.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              {new Date(req.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true
                              })}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Pending Approval
                              </span>
                            )}
                            {isApproved && (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle size={12} className="text-emerald-600" />
                                  Approved & Paid
                                </span>
                                {req.paidVia && (
                                  <span className="text-[10px] text-gray-500 block mt-0.5 uppercase font-medium">
                                    via {req.paidVia}
                                  </span>
                                )}
                              </div>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle size={12} className="text-rose-500" />
                                Rejected
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-4 text-center">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => openRequestModal(req, "approve")}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-sm cursor-pointer"
                                >
                                  <Check size={13} />
                                  Approve & Pay
                                </button>
                                <button
                                  onClick={() => openRequestModal(req, "reject")}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition border border-rose-200 cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openRequestModal(req, "details")}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition flex items-center gap-1 mx-auto cursor-pointer"
                              >
                                <Eye size={13} />
                                View Details
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SETTLEMENT LEDGER ENGINE */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          {/* Summary Financial Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-gray-400">Total Ledgers</span>
              <h4 className="text-xl font-bold text-gray-800 mt-1">{ledgerSummary.count || ledgers.length}</h4>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-gray-400">Gross Sales</span>
              <h4 className="text-xl font-bold text-gray-800 mt-1">₹{Number(ledgerSummary.totalGrossSales || 0).toLocaleString()}</h4>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-100 bg-rose-50/30 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-rose-600">Commission (20%)</span>
              <h4 className="text-xl font-bold text-rose-700 mt-1">-₹{Number(ledgerSummary.totalCommission || 0).toLocaleString()}</h4>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/30 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-blue-600">Packaging</span>
              <h4 className="text-xl font-bold text-blue-700 mt-1">+₹{Number(ledgerSummary.totalPackaging || 0).toLocaleString()}</h4>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/30 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-amber-600">Coupon Share</span>
              <h4 className="text-xl font-bold text-amber-700 mt-1">-₹{Number(ledgerSummary.totalCouponShare || 0).toLocaleString()}</h4>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-emerald-700">Net Payable</span>
              <h4 className="text-xl font-extrabold text-emerald-700 mt-1">₹{Number(ledgerSummary.totalNetPayable || 0).toLocaleString()}</h4>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Status Filter</label>
                <select
                  value={ledgerStatusFilter}
                  onChange={(e) => setLedgerStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Lifecycle Statuses</option>
                  <option value="CALCULATED">CALCULATED</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PAID">PAID</option>
                  <option value="RECONCILED">RECONCILED</option>
                  <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Settlement Cycle</label>
                <select
                  value={cycleFilter}
                  onChange={(e) => setCycleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Cycles (T+1/T+2...)</option>
                  <option value="T+1">T+1 (1 Day)</option>
                  <option value="T+2">T+2 (2 Days)</option>
                  <option value="T+3">T+3 (3 Days)</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">ECDKART Model: 2–3 Days</span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {loadingLedgers ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <RefreshCw className="animate-spin text-emerald-600 mb-3" size={32} />
                  <p className="text-gray-500 text-sm font-medium">Calculating settlement ledger lines...</p>
                </div>
              ) : errorLedgers ? (
                <div className="py-16 text-center text-rose-600 font-semibold">{errorLedgers}</div>
              ) : ledgers.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                  <FileText size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="font-semibold">No settlement ledger lines found for the selected filter.</p>
                  <button
                    onClick={handleSyncOrders}
                    className="mt-3 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Sync Completed Orders
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                      <th className="py-3.5 px-4">Settlement ID</th>
                      <th className="py-3.5 px-4">Restaurant</th>
                      <th className="py-3.5 px-4">Order ID</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Gross Sales</th>
                      <th className="py-3.5 px-4">Commission</th>
                      <th className="py-3.5 px-4">Packaging</th>
                      <th className="py-3.5 px-4">Net Payable</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledgers.map((row) => (
                      <tr key={row._id} className="hover:bg-gray-50 transition">
                        <td className="py-3.5 px-4 font-mono font-semibold text-xs text-gray-900">
                          {row.settlementId || row._id.slice(-8).toUpperCase()}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          <div className="flex items-center justify-between gap-2">
                            <span>{row.restaurant?.name || "N/A"}</span>
                            <button
                              onClick={() => {
                                setSelectedRestaurantForCycle(row.restaurant);
                                setNewCycleValue(row.restaurant?.settlementCycle || "T+2");
                                setCycleModalOpen(true);
                              }}
                              className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-mono cursor-pointer"
                              title="Configure Settlement Cycle"
                            >
                              {row.restaurant?.settlementCycle || "T+2"}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                          {row.order?.orderNumber || row.order?._id?.slice(-8) || "N/A"}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {row.orderType || "delivery"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-gray-900">₹{row.grossSales}</td>

                        <td className="py-3.5 px-4 font-semibold text-rose-600">
                          -₹{row.platformCommissionAmount}
                          <span className="text-[10px] text-gray-400 block font-normal">
                            ({row.platformCommissionPercent}%)
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-gray-700">₹{row.packagingFee || 0}</td>

                        <td className="py-3.5 px-4 font-extrabold text-emerald-700 text-base">
                          ₹{row.netPayable}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColorClass(
                              row.status
                            )}`}
                          >
                            {row.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedLedger(row);
                              setBreakdownModalOpen(true);
                            }}
                            className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                          >
                            Breakdown & Lifecycle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Approve Payout Request Modal */}
      {requestModalType === "approve" && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="text-emerald-600" size={22} />
                Approve & Record Restaurant Payout
              </h3>
              <button onClick={closeRequestModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">
                ×
              </button>
            </div>

            <div className="my-5 space-y-4 text-sm">
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Restaurant Name:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedRequest.restaurantProfile?.name || selectedRequest.bankDetails?.accountHolder}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Restaurant Phone:</span>
                  <span className="font-semibold text-gray-900">{selectedRequest.bankDetails?.phone || selectedRequest.restaurantProfile?.contactNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Restaurant ID:</span>
                  <span className="font-mono text-xs font-semibold text-gray-800">
                    {selectedRequest.restaurantDisplayId || selectedRequest.restaurant?._id}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-600 font-semibold">Net Payout Amount:</span>
                  <span className="text-xl font-extrabold text-emerald-700">
                    ₹{Number(selectedRequest.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment Method Option */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Payment Method Used to Transfer Funds:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPaidVia("upi")}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      paidVia === "upi" ? "border-emerald-600 bg-emerald-50/50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${paidVia === 'upi' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'}`}>
                          {paidVia === 'upi' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                        </span>
                        Paid via UPI
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">UPI</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-[11px] text-gray-500 block">Restaurant UPI:</span>
                      <span className="font-mono text-xs font-bold text-gray-900 truncate block">
                        {selectedRequest.bankDetails?.upiId || "Not Provided"}
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaidVia("bank")}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      paidVia === "bank" ? "border-emerald-600 bg-emerald-50/50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${paidVia === 'bank' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'}`}>
                          {paidVia === 'bank' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                        </span>
                        Bank Transfer
                      </span>
                      <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">IMPS/NEFT</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-[11px] text-gray-500 block">A/C: {selectedRequest.bankDetails?.accountNumber || "N/A"}</span>
                      <span className="font-mono text-xs font-bold text-gray-900 truncate block">
                        IFSC: {selectedRequest.bankDetails?.ifsc || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* UTR Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bank Reference / UTR Number (Recommended)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR9876543210"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {/* Admin Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Processed via HDFC Business Portal"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button onClick={closeRequestModal} disabled={processing} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-semibold transition cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleApproveRequest}
                disabled={processing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                {processing ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                Confirm Payout & Update Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Reject Payout Request Modal */}
      {requestModalType === "reject" && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <XCircle className="text-rose-600" size={22} />
                Reject Restaurant Payout Request
              </h3>
              <button onClick={closeRequestModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">
                ×
              </button>
            </div>

            <div className="my-5 space-y-4 text-sm">
              <p className="text-gray-600">
                Are you sure you want to reject the payout request of{" "}
                <span className="font-bold text-gray-900">₹{Number(selectedRequest.amount).toLocaleString()}</span> for{" "}
                <span className="font-bold text-gray-900">{selectedRequest.restaurantProfile?.name || selectedRequest.bankDetails?.accountHolder}</span>?
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Bank details mismatch or invalid IFSC code"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button onClick={closeRequestModal} disabled={processing} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-semibold transition cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleRejectRequest}
                disabled={processing}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition shadow-md cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Settlement Ledger Breakdown & Lifecycle Stepper Modal */}
      {breakdownModalOpen && selectedLedger && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Settlement Ledger Line Breakdown</h3>
                <span className="text-xs text-gray-400 font-mono">ID: {selectedLedger.settlementId}</span>
              </div>
              <button onClick={() => setBreakdownModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">
                ×
              </button>
            </div>

            <div className="my-5 space-y-4 text-sm">
              <div className="bg-gray-50 p-3.5 rounded-xl border space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Restaurant:</span>
                  <span className="font-semibold text-gray-900">{selectedLedger.restaurant?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID / Number:</span>
                  <span className="font-mono text-xs font-semibold text-gray-800">
                    {selectedLedger.order?.orderNumber || selectedLedger.order?._id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Type:</span>
                  <span className="font-semibold uppercase text-xs text-gray-800">{selectedLedger.orderType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Settlement Cycle:</span>
                  <span className="font-semibold text-emerald-700">{selectedLedger.settlementCycle || "T+2"}</span>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-bold uppercase text-gray-400">Financial Ledger Line Formula</h4>
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                  <span>Food Item Gross Sales:</span>
                  <span className="font-bold">₹{selectedLedger.grossSales}</span>
                </div>
                <div className="flex justify-between p-2 bg-rose-50 text-rose-800 rounded-lg">
                  <span>Platform Commission ({selectedLedger.platformCommissionPercent}%):</span>
                  <span className="font-bold">-₹{selectedLedger.platformCommissionAmount}</span>
                </div>
                <div className="flex justify-between p-2 bg-blue-50 text-blue-800 rounded-lg">
                  <span>Packaging Fee Component:</span>
                  <span className="font-bold">+₹{selectedLedger.packagingFee || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-amber-50 text-amber-800 rounded-lg">
                  <span>Coupon Share ({selectedLedger.couponFundingSource || "ECDKART"}):</span>
                  <span className="font-bold">-₹{selectedLedger.couponDiscountShare || 0}</span>
                </div>
                <div className="flex justify-between p-3 bg-emerald-100 text-emerald-900 rounded-xl font-extrabold text-base">
                  <span>Net Restaurant Payable:</span>
                  <span>₹{selectedLedger.netPayable}</span>
                </div>
              </div>

              {/* Lifecycle Stepper / Transition */}
              <div className="border-t pt-3 space-y-2">
                <h4 className="text-xs font-bold uppercase text-gray-500">Settlement Lifecycle Transition</h4>
                <div className="flex flex-wrap gap-2">
                  {["CALCULATED", "REVIEW", "APPROVED", "PROCESSING", "PAID", "RECONCILED", "PAYMENT_FAILED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateLedgerStatus(selectedLedger._id, st)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        selectedLedger.status === st
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t">
              <button onClick={() => setBreakdownModalOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-semibold transition cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Configure Settlement Cycle Modal */}
      {cycleModalOpen && selectedRestaurantForCycle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-gray-800 mb-1">Configure Settlement Cycle</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedRestaurantForCycle.name}</p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700">Select Operating Cycle</label>
              <select
                value={newCycleValue}
                onChange={(e) => setNewCycleValue(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="T+1">T+1 (Daily Next Day)</option>
                <option value="T+2">T+2 (ECDKART Operating Standard 2 Days)</option>
                <option value="T+3">T+3 (3 Days Cycle)</option>
                <option value="Weekly">Weekly (Every Sunday)</option>
                <option value="Custom">Custom Schedule</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t">
              <button onClick={() => setCycleModalOpen(false)} className="px-3 py-1.5 text-gray-600 text-xs font-semibold cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveSettlementCycle} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer">
                Save Cycle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
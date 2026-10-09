import React, { useState, useEffect } from "react";
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
  User,
  Phone,
  AlertCircle,
  Eye,
  FileText,
  TrendingUp,
  Navigation,
  CloudRain,
  Zap,
  Award
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { API_BASE_URL } from "../../../utils/utils";
import { toast } from "react-hot-toast";

export default function RiderPayoutRequests() {
  const [activeTab, setActiveTab] = useState("requests"); // 'requests' | 'ledger'

  // Payout Requests states
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [errorRequests, setErrorRequests] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");

  // Rider Ledger states
  const [ledgers, setLedgers] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState({});
  const [earningConfig, setEarningConfig] = useState({});
  const [loadingLedgers, setLoadingLedgers] = useState(false);
  const [errorLedgers, setErrorLedgers] = useState(null);
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState("");

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

  // Modal states for Rider Ledger
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);

  // Fetch Rider Payout Requests from real DB
  const fetchWithdrawals = async () => {
    try {
      setLoadingRequests(true);
      setErrorRequests(null);
      const token = localStorage.getItem("token");
      const url = `${API_BASE_URL}/api/admin/withdrawals?requestType=rider${
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
      console.error("Error fetching rider payout requests:", err);
      setErrorRequests(
        err.response?.data?.message || err.message || "Failed to load rider payout requests"
      );
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch Rider Settlement Ledgers from real DB
  const fetchRiderSettlements = async () => {
    try {
      setLoadingLedgers(true);
      setErrorLedgers(null);
      const token = localStorage.getItem("token");
      const params = {};
      if (ledgerStatusFilter) params.status = ledgerStatusFilter;

      const res = await axios.get(`${API_BASE_URL}/api/settlements/riders`, {
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
      if (res.data.config) {
        setEarningConfig(res.data.config);
      }
    } catch (err) {
      console.error("Error fetching rider settlement ledgers:", err);
      setErrorLedgers(err.response?.data?.message || err.message || "Failed to fetch rider settlement ledgers");
    } finally {
      setLoadingLedgers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "requests") {
      fetchWithdrawals();
    } else {
      fetchRiderSettlements();
    }
  }, [activeTab, requestStatusFilter, ledgerStatusFilter]);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Approve Rider Payout Request
  const handleApprove = async () => {
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
            upiId: selectedRequest.bankDetails?.upiId || selectedRequest.user?.upi || "",
            accountNumber: selectedRequest.bankDetails?.accountNumber || "",
            ifsc: selectedRequest.bankDetails?.ifsc || selectedRequest.bankDetails?.ifscCode || "",
            bankName: selectedRequest.bankDetails?.bankName || "",
            accountHolder: selectedRequest.bankDetails?.accountHolder || selectedRequest.user?.name || ""
          }
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );
      if (res.data.success) {
        toast.success("Rider payout approved & notification sent!");
        setActionSuccess("Withdrawal request approved & payment notification sent!");
        setTimeout(() => setActionSuccess(""), 4000);
        closeRequestModal();
        fetchWithdrawals();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve withdrawal request");
    } finally {
      setProcessing(false);
    }
  };

  // Reject Rider Payout Request
  const handleReject = async () => {
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
        toast.success("Rider payout request rejected");
        setActionSuccess("Withdrawal request rejected!");
        setTimeout(() => setActionSuccess(""), 3000);
        closeRequestModal();
        fetchWithdrawals();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject withdrawal request");
    } finally {
      setProcessing(false);
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
    const name = r.user?.name || r.bankDetails?.accountHolder || "";
    const phone = r.user?.mobile || r.bankDetails?.phone || "";
    const riderId = r.riderId || r.rider?._id || r.user?._id || "";
    const upi = r.bankDetails?.upiId || r.bankDetails?.upi || "";
    const accNum = r.bankDetails?.accountNumber || "";
    const ifsc = r.bankDetails?.ifsc || "";
    const query = searchQuery.toLowerCase();

    return (
      name.toLowerCase().includes(query) ||
      phone.toLowerCase().includes(query) ||
      riderId.toLowerCase().includes(query) ||
      upi.toLowerCase().includes(query) ||
      accNum.toLowerCase().includes(query) ||
      ifsc.toLowerCase().includes(query)
    );
  });

  // Calculate Request KPIs from real DB
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved" || r.status === "processed").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;
  const totalPendingAmount = requests
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalPaidAmount = requests
    .filter((r) => r.status === "approved" || r.status === "processed")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="w-full bg-gray-50 min-h-screen p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Rider Settlement & Payout Engine"
          breadcrumbs={[
            { label: "Riders", active: false },
            { label: "Payout Requests & Settlement", active: true }
          ]}
        />
        <button
          onClick={activeTab === "requests" ? fetchWithdrawals : fetchRiderSettlements}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm self-start md:self-auto cursor-pointer"
        >
          <RefreshCw size={16} className={(loadingRequests || loadingLedgers) ? "animate-spin text-emerald-600" : "text-gray-500"} />
          Refresh
        </button>
      </div>

      {/* Navigation Mode Toggle Tabs */}
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
          Rider Payout Requests
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'requests' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
            {totalCount}
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
          Rider Settlement Ledger Engine
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

      {/* TAB 1: RIDER PAYOUT REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {/* KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Requests</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalCount}</h3>
                <span className="text-xs text-gray-500 font-medium">All time payout tickets</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wallet size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Pending Approval</p>
                <h3 className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</h3>
                <span className="text-xs font-semibold text-amber-600">₹{totalPendingAmount.toLocaleString()} Pending</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Approved & Paid</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-1">{approvedCount}</h3>
                <span className="text-xs font-semibold text-emerald-600">₹{totalPaidAmount.toLocaleString()} Disbursed</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Rejected Requests</p>
                <h3 className="text-2xl font-bold text-rose-700 mt-1">{rejectedCount}</h3>
                <span className="text-xs text-rose-500 font-medium">Requires rider review</span>
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
                  { label: "All Requests", value: "all", count: totalCount },
                  { label: "Pending", value: "pending", count: pendingCount },
                  { label: "Approved", value: "approved", count: approvedCount },
                  { label: "Rejected", value: "rejected", count: rejectedCount }
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

              {/* Search Box */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="text"
                  placeholder="Search rider name, phone, UPI, A/C..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Requests Table */}
            <div className="overflow-x-auto">
              {loadingRequests ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <RefreshCw className="animate-spin text-emerald-600 mb-3" size={32} />
                  <p className="text-gray-500 text-sm font-medium">Fetching rider payout requests from DB...</p>
                </div>
              ) : errorRequests ? (
                <div className="py-16 text-center">
                  <AlertCircle className="text-rose-500 mx-auto mb-3" size={36} />
                  <p className="text-rose-600 font-semibold">{errorRequests}</p>
                  <button
                    onClick={fetchWithdrawals}
                    className="mt-3 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <Wallet size={28} />
                  </div>
                  <h4 className="text-base font-semibold text-gray-700">No Payout Requests Found</h4>
                  <p className="text-gray-400 text-xs mt-1">
                    {searchQuery
                      ? "Try searching with a different rider name or mobile number."
                      : "When riders request earnings payout from the app, they will appear here."}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                      <th className="py-3.5 px-4">#</th>
                      <th className="py-3.5 px-4">Rider Details</th>
                      <th className="py-3.5 px-4">Rider ID / Phone</th>
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
                      const riderName =
                        req.user?.name || req.bankDetails?.accountHolder || "Rider Partner";
                      const riderPhone =
                        req.user?.mobile || req.bankDetails?.phone || "N/A";
                      const riderDisplayId =
                        req.riderId ||
                        (req.rider?._id ? `RID-${req.rider._id.slice(-6).toUpperCase()}` : null) ||
                        (req.user?._id ? `USR-${req.user._id.slice(-6).toUpperCase()}` : "N/A");
                      const upiId =
                        req.bankDetails?.upiId ||
                        req.bankDetails?.upi ||
                        req.user?.upi ||
                        "";
                      const accNum = req.bankDetails?.accountNumber || "";
                      const ifsc = req.bankDetails?.ifsc || req.bankDetails?.ifscCode || "";
                      const bankName = req.bankDetails?.bankName || "";
                      const accHolder = req.bankDetails?.accountHolder || riderName;

                      const isPending = req.status === "pending";
                      const isApproved = req.status === "approved" || req.status === "processed";
                      const isRejected = req.status === "rejected";

                      return (
                        <tr key={req._id} className="hover:bg-gray-50/80 transition group">
                          <td className="py-4 px-4 text-gray-400 text-xs font-medium">{idx + 1}</td>

                          {/* Rider Details */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shadow-sm">
                                {riderName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900 block leading-tight">
                                  {riderName}
                                </span>
                                <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                  <User size={11} />
                                  {req.user?.email || "Rider Partner"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* ID & Phone */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <span className="inline-block bg-slate-100 text-slate-700 font-mono text-xs px-2 py-0.5 rounded-md font-semibold border border-slate-200">
                                {riderDisplayId}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                                <Phone size={12} className="text-gray-400" />
                                <span>{riderPhone}</span>
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
                                    {bankName} {accHolder ? `(${accHolder})` : ''}
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
                            <span className="text-[10px] text-gray-400 block">Available</span>
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
                                Pending
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

      {/* TAB 2: RIDER SETTLEMENT LEDGER ENGINE */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          {/* Formula Concept Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-300">Rider Earning Formula Concept</span>
              <h3 className="text-lg font-bold mt-0.5">Base Pay + Distance Pay + Surge/Rain Bonuses = Net Earning</h3>
              <p className="text-xs text-emerald-100 mt-1">
                Example: Base ₹20 + Distance ₹15 + Peak ₹10 + Rain ₹10 = Gross ₹55 → Adjustments ₹0 → Net Earning ₹55
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl text-xs font-mono">
              <span>Slabs Config: Base ₹{earningConfig.baseEarning || 20} | Rain ₹{earningConfig.rainBonus || 15}</span>
            </div>
          </div>

          {/* Financial Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-gray-400">Total Rider Orders</span>
              <h4 className="text-xl font-bold text-gray-800 mt-1">{ledgerSummary.totalOrders || ledgers.length}</h4>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/30 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-blue-600">Base Pay (₹20)</span>
              <h4 className="text-xl font-bold text-blue-700 mt-1">₹{Number(ledgerSummary.totalBasePay || 0).toLocaleString()}</h4>
            </div>

            <div className="bg-white p-4 rounded-xl border border-purple-100 bg-purple-50/30 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-purple-600">Distance Pay</span>
              <h4 className="text-xl font-bold text-purple-700 mt-1">₹{Number(ledgerSummary.totalDistancePay || 0).toLocaleString()}</h4>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/30 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-amber-600">Surge & Rain Bonuses</span>
              <h4 className="text-xl font-bold text-amber-700 mt-1">₹{Number((ledgerSummary.totalSurgeBonus || 0) + (ledgerSummary.totalRainBonus || 0)).toLocaleString()}</h4>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-emerald-700">Net Rider Earnings</span>
              <h4 className="text-xl font-extrabold text-emerald-700 mt-1">₹{Number(ledgerSummary.totalNetEarnings || 0).toLocaleString()}</h4>
            </div>
          </div>

          {/* Ledger Table Container */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {loadingLedgers ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <RefreshCw className="animate-spin text-emerald-600 mb-3" size={32} />
                  <p className="text-gray-500 text-sm font-medium">Calculating rider settlement lines...</p>
                </div>
              ) : errorLedgers ? (
                <div className="py-16 text-center text-rose-600 font-semibold">{errorLedgers}</div>
              ) : ledgers.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                  <FileText size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="font-semibold">No rider settlement lines found in DB.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                      <th className="py-3.5 px-4">Order / Settlement ID</th>
                      <th className="py-3.5 px-4">Rider Partner</th>
                      <th className="py-3.5 px-4">Rider ID / Phone</th>
                      <th className="py-3.5 px-4">Distance</th>
                      <th className="py-3.5 px-4">Base Pay</th>
                      <th className="py-3.5 px-4">Distance Pay</th>
                      <th className="py-3.5 px-4">Surge & Rain</th>
                      <th className="py-3.5 px-4">Net Rider Earning</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledgers.map((row) => (
                      <tr key={row._id} className="hover:bg-gray-50 transition">
                        <td className="py-3.5 px-4 font-mono font-semibold text-xs text-gray-900">
                          {row.orderId}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          {row.riderName}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                          <div>{row.riderId}</div>
                          <div className="text-[11px] text-gray-400">{row.riderPhone}</div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-gray-700">
                          {row.deliveryDistanceKm} km
                        </td>

                        <td className="py-3.5 px-4 font-medium text-blue-700">
                          ₹{row.breakdown?.basePay}
                        </td>

                        <td className="py-3.5 px-4 font-medium text-purple-700">
                          ₹{row.breakdown?.distancePay}
                        </td>

                        <td className="py-3.5 px-4 font-medium text-amber-700">
                          +₹{(row.breakdown?.surgeBonus || 0) + (row.breakdown?.rainBonus || 0)}
                        </td>

                        <td className="py-3.5 px-4 font-extrabold text-emerald-700 text-base">
                          ₹{row.breakdown?.netEarning}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              row.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-blue-100 text-blue-800 border-blue-300"
                            }`}
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
                            Breakdown & Stepper
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

      {/* MODAL 1: Approve Payout Modal */}
      {requestModalType === "approve" && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="text-emerald-600" size={22} />
                Approve & Record Rider Payout
              </h3>
              <button onClick={closeRequestModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">
                ×
              </button>
            </div>

            <div className="my-5 space-y-4 text-sm">
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Rider Name:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedRequest.user?.name || selectedRequest.bankDetails?.accountHolder}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rider Phone:</span>
                  <span className="font-semibold text-gray-900">{selectedRequest.user?.mobile || selectedRequest.bankDetails?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rider ID:</span>
                  <span className="font-mono text-xs font-semibold text-gray-800">
                    {selectedRequest.riderId || selectedRequest.user?._id}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-600 font-semibold">Amount to Pay:</span>
                  <span className="text-xl font-extrabold text-emerald-700">
                    ₹{Number(selectedRequest.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment Channel Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Select Payment Method Used to Pay Rider:
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
                      <span className="text-[11px] text-gray-500 block">Rider UPI ID:</span>
                      <span className="font-mono text-xs font-bold text-gray-900 truncate block">
                        {selectedRequest.bankDetails?.upiId || selectedRequest.user?.upi || "Not Provided"}
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
                  Transaction / UTR / Reference ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR1234567890"
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
                  placeholder="e.g. Sent via GPay Business"
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
                onClick={handleApprove}
                disabled={processing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                {processing ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                Confirm & Send Payout Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Reject Payout Modal */}
      {requestModalType === "reject" && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <XCircle className="text-rose-600" size={22} />
                Reject Rider Payout Request
              </h3>
              <button onClick={closeRequestModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">
                ×
              </button>
            </div>

            <div className="my-5 space-y-4 text-sm">
              <p className="text-gray-600">
                Are you sure you want to reject the payout request of{" "}
                <span className="font-bold text-gray-900">₹{Number(selectedRequest.amount).toLocaleString()}</span> for{" "}
                <span className="font-bold text-gray-900">{selectedRequest.user?.name || selectedRequest.bankDetails?.accountHolder}</span>?
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Account number mismatch"
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
                onClick={handleReject}
                disabled={processing}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition shadow-md cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Rider Ledger Itemized Breakdown & Stepper Modal */}
      {breakdownModalOpen && selectedLedger && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Rider Earning Breakdown</h3>
                <span className="text-xs text-gray-400 font-mono">Order ID: {selectedLedger.orderId}</span>
              </div>
              <button onClick={() => setBreakdownModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">
                ×
              </button>
            </div>

            <div className="my-5 space-y-4 text-sm">
              <div className="bg-gray-50 p-3.5 rounded-xl border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Rider Partner:</span>
                  <span className="font-semibold text-gray-900">{selectedLedger.riderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rider ID / Phone:</span>
                  <span className="font-mono text-xs font-semibold text-gray-800">{selectedLedger.riderId} ({selectedLedger.riderPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trip Distance:</span>
                  <span className="font-semibold text-gray-800">{selectedLedger.deliveryDistanceKm} km</span>
                </div>
              </div>

              {/* Itemized Calculation */}
              <div className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-bold uppercase text-gray-400">Rider Earnings Ledger Formula</h4>
                <div className="flex justify-between p-2 bg-blue-50 text-blue-900 rounded-lg">
                  <span>Base Earning (Fixed Slab):</span>
                  <span className="font-bold">+₹{selectedLedger.breakdown?.basePay}</span>
                </div>
                <div className="flex justify-between p-2 bg-purple-50 text-purple-900 rounded-lg">
                  <span>Distance Pay ({selectedLedger.deliveryDistanceKm} km):</span>
                  <span className="font-bold">+₹{selectedLedger.breakdown?.distancePay}</span>
                </div>
                <div className="flex justify-between p-2 bg-amber-50 text-amber-900 rounded-lg">
                  <span>Peak Surge Bonus:</span>
                  <span className="font-bold">+₹{selectedLedger.breakdown?.surgeBonus}</span>
                </div>
                <div className="flex justify-between p-2 bg-teal-50 text-teal-900 rounded-lg">
                  <span>Rain Weather Bonus:</span>
                  <span className="font-bold">+₹{selectedLedger.breakdown?.rainBonus}</span>
                </div>
                {selectedLedger.breakdown?.incentiveBonus > 0 && (
                  <div className="flex justify-between p-2 bg-indigo-50 text-indigo-900 rounded-lg">
                    <span>Tip / Incentive Bonus:</span>
                    <span className="font-bold">+₹{selectedLedger.breakdown?.incentiveBonus}</span>
                  </div>
                )}
                <div className="flex justify-between p-3 bg-emerald-100 text-emerald-950 rounded-xl font-extrabold text-base">
                  <span>Net Rider Earning:</span>
                  <span>₹{selectedLedger.breakdown?.netEarning}</span>
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

      {/* MODAL 4: View Rider Payout Details Modal */}
      {requestModalType === "details" && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Eye className="text-emerald-600" size={22} />
                Rider Payout Transaction Details
              </h3>
              <button onClick={closeRequestModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">
                ×
              </button>
            </div>

            <div className="my-5 space-y-4 text-sm">
              {/* Status Header Badge */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                selectedRequest.status === "approved" || selectedRequest.status === "processed"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : selectedRequest.status === "rejected"
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block">Payout Status</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {selectedRequest.status === "approved" || selectedRequest.status === "processed" ? (
                      <CheckCircle className="text-emerald-600" size={18} />
                    ) : selectedRequest.status === "rejected" ? (
                      <XCircle className="text-rose-600" size={18} />
                    ) : (
                      <Clock className="text-amber-600" size={18} />
                    )}
                    <span className="font-bold text-base capitalize">
                      {selectedRequest.status === "approved" || selectedRequest.status === "processed" ? "Approved & Paid" : selectedRequest.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 font-semibold block">Disbursed Amount</span>
                  <span className="text-2xl font-extrabold text-emerald-700">
                    ₹{Number(selectedRequest.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Rider Info Box */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Rider Partner Info</h4>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rider Name:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedRequest.user?.name || selectedRequest.bankDetails?.accountHolder || "Rider Partner"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rider Mobile:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedRequest.user?.mobile || selectedRequest.bankDetails?.phone || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rider ID:</span>
                  <span className="font-mono text-xs font-semibold text-gray-800">
                    {selectedRequest.riderId || selectedRequest.user?._id || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Wallet Balance:</span>
                  <span className="font-semibold text-gray-800">
                    ₹{Number(selectedRequest.walletBalance || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Payment Destination Details */}
              <div className="p-4 bg-purple-50/50 rounded-xl space-y-2 border border-purple-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700">Disbursement Account & Details</h4>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Channel:</span>
                  <span className="font-bold text-xs uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    {selectedRequest.paidVia || selectedRequest.method || "UPI"}
                  </span>
                </div>

                {selectedRequest.bankDetails?.upiId || selectedRequest.user?.upi ? (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">UPI ID:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs font-semibold text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-200">
                        {selectedRequest.bankDetails?.upiId || selectedRequest.user?.upi}
                      </span>
                      <button
                        onClick={() => handleCopy(selectedRequest.bankDetails?.upiId || selectedRequest.user?.upi, `det_upi_${selectedRequest._id}`)}
                        className="p-1 text-gray-400 hover:text-purple-700 cursor-pointer"
                      >
                        {copiedId === `det_upi_${selectedRequest._id}` ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                ) : null}

                {selectedRequest.bankDetails?.accountNumber ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Account Number:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {selectedRequest.bankDetails?.accountNumber}
                        </span>
                        <button
                          onClick={() => handleCopy(selectedRequest.bankDetails?.accountNumber, `det_acc_${selectedRequest._id}`)}
                          className="p-1 text-gray-400 hover:text-emerald-600 cursor-pointer"
                        >
                          {copiedId === `det_acc_${selectedRequest._id}` ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">IFSC Code:</span>
                      <span className="font-mono text-xs font-semibold text-gray-800">
                        {selectedRequest.bankDetails?.ifsc || selectedRequest.bankDetails?.ifscCode || "N/A"}
                      </span>
                    </div>
                    {selectedRequest.bankDetails?.bankName && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Bank Name:</span>
                        <span className="font-semibold text-xs text-gray-800">
                          {selectedRequest.bankDetails.bankName}
                        </span>
                      </div>
                    )}
                  </>
                ) : null}

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Holder Name:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedRequest.bankDetails?.accountHolder || selectedRequest.user?.name || "Rider Partner"}
                  </span>
                </div>
              </div>

              {/* Transaction Tracking & Audit Trail */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Transaction Audit & Reference</h4>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">UTR / Reference ID:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-300">
                      {selectedRequest.utrNumber || selectedRequest.transactionId || "N/A"}
                    </span>
                    {(selectedRequest.utrNumber || selectedRequest.transactionId) && (
                      <button
                        onClick={() => handleCopy(selectedRequest.utrNumber || selectedRequest.transactionId, `det_utr_${selectedRequest._id}`)}
                        className="p-1 text-gray-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedId === `det_utr_${selectedRequest._id}` ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Admin Note / Reason:</span>
                  <span className="font-medium text-gray-800 italic max-w-[220px] text-right">
                    {selectedRequest.adminNote || "No additional notes provided."}
                  </span>
                </div>

                {selectedRequest.approvedBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved By:</span>
                    <span className="font-semibold text-gray-800">{selectedRequest.approvedBy}</span>
                  </div>
                )}

                {selectedRequest.rejectedBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rejected By:</span>
                    <span className="font-semibold text-rose-700">{selectedRequest.rejectedBy}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Requested On:</span>
                  <span className="font-medium text-gray-700">
                    {new Date(selectedRequest.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    })}
                  </span>
                </div>

                {selectedRequest.processedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed On:</span>
                    <span className="font-medium text-gray-700">
                      {new Date(selectedRequest.processedAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t">
              <button onClick={closeRequestModal} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-semibold transition cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

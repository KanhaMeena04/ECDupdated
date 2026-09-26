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
  ArrowUpRight,
  User,
  Phone,
  AlertCircle,
  Send,
  Eye
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { API_BASE_URL } from "../../../utils/utils";

export default function RiderPayoutRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalType, setModalType] = useState(null); // 'approve' | 'reject' | 'details'
  const [paidVia, setPaidVia] = useState("upi"); // 'upi' | 'bank'
  const [adminNote, setAdminNote] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `${API_BASE_URL}/api/admin/withdrawals${
        statusFilter !== "all" ? `?status=${statusFilter}` : ""
      }`;
      const res = await axios.get(url, { withCredentials: true });
      if (res.data?.withdrawals) {
        setRequests(res.data.withdrawals);
      } else if (Array.isArray(res.data)) {
        setRequests(res.data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load withdrawal requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      setProcessing(true);
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
        { withCredentials: true }
      );
      setActionSuccess("Withdrawal request approved & payment notification sent!");
      setTimeout(() => setActionSuccess(""), 3500);
      closeModal();
      fetchWithdrawals();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve withdrawal request");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      setProcessing(true);
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/withdrawals/${selectedRequest._id}/reject`,
        { reason: adminNote || "Rejected by admin" },
        { withCredentials: true }
      );
      setActionSuccess("Withdrawal request rejected!");
      setTimeout(() => setActionSuccess(""), 3000);
      closeModal();
      fetchWithdrawals();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject withdrawal request");
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (req, type) => {
    setSelectedRequest(req);
    setModalType(type);
    setPaidVia(req.method === 'bank' || (!req.bankDetails?.upiId && req.bankDetails?.accountNumber) ? 'bank' : 'upi');
    setAdminNote("");
    setUtrNumber("");
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setModalType(null);
    setAdminNote("");
    setUtrNumber("");
  };

  // Filtered requests based on search
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

  // Calculate metrics
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Rider Payout Requests"
          breadcrumbs={[
            { label: "Riders", active: false },
            { label: "Payout Requests", active: true }
          ]}
        />
        <button
          onClick={fetchWithdrawals}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm self-start md:self-auto cursor-pointer"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-emerald-600" : "text-gray-500"} />
          Refresh
        </button>
      </div>

      {/* Success Notification Alert */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle className="text-emerald-600" size={20} />
          <span className="font-medium text-sm">{actionSuccess}</span>
        </div>
      )}

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

      {/* Main Table Card */}
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
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === tab.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.value
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
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <RefreshCw className="animate-spin text-emerald-600 mb-3" size={32} />
              <p className="text-gray-500 text-sm font-medium">Fetching rider payout requests...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <AlertCircle className="text-rose-500 mx-auto mb-3" size={36} />
              <p className="text-rose-600 font-semibold">{error}</p>
              <button
                onClick={fetchWithdrawals}
                className="mt-3 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
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
                    <tr
                      key={req._id}
                      className="hover:bg-gray-50/80 transition group"
                    >
                      {/* Index */}
                      <td className="py-4 px-4 text-gray-400 text-xs font-medium">
                        {idx + 1}
                      </td>

                      {/* Rider Name & Avatar */}
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

                      {/* Rider ID & Phone */}
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

                      {/* Current Wallet Balance */}
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
                              onClick={() => openModal(req, "approve")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <Check size={13} />
                              Approve & Pay
                            </button>
                            <button
                              onClick={() => openModal(req, "reject")}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition border border-rose-200 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openModal(req, "details")}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Eye size={13} />
                            View
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

      {/* Approve / Pay Modal */}
      {modalType === "approve" && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="text-emerald-600" size={22} />
                Approve & Record Payout
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">
                ×
              </button>
            </div>

            <div className="my-5 space-y-4 text-sm">
              {/* Recipient Details Box */}
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
                  {/* UPI Option */}
                  <div
                    onClick={() => setPaidVia("upi")}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      paidVia === "upi"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${paidVia === 'upi' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'}`}>
                          {paidVia === 'upi' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                        </span>
                        Paid via UPI
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        UPI
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="text-[11px] text-gray-500 block">Rider UPI ID:</span>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="font-mono text-xs font-bold text-gray-900 truncate">
                          {selectedRequest.bankDetails?.upiId || selectedRequest.bankDetails?.upi || selectedRequest.user?.upi || "Not Provided"}
                        </span>
                        {(selectedRequest.bankDetails?.upiId || selectedRequest.user?.upi) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(selectedRequest.bankDetails?.upiId || selectedRequest.user?.upi, "modal_upi");
                            }}
                            className="text-gray-400 hover:text-emerald-600 p-1"
                            title="Copy UPI"
                          >
                            {copiedId === "modal_upi" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bank Option */}
                  <div
                    onClick={() => setPaidVia("bank")}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      paidVia === "bank"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${paidVia === 'bank' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'}`}>
                          {paidVia === 'bank' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                        </span>
                        Bank Transfer
                      </span>
                      <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        IMPS/NEFT
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="text-[11px] text-gray-500 block">A/C: {selectedRequest.bankDetails?.accountNumber || "N/A"}</span>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="font-mono text-xs font-bold text-gray-900 truncate">
                          IFSC: {selectedRequest.bankDetails?.ifsc || selectedRequest.bankDetails?.ifscCode || "N/A"}
                        </span>
                        {selectedRequest.bankDetails?.accountNumber && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(selectedRequest.bankDetails?.accountNumber, "modal_acc");
                            }}
                            className="text-gray-400 hover:text-emerald-600 p-1"
                            title="Copy Account Number"
                          >
                            {copiedId === "modal_acc" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* UTR Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Transaction / UTR / Reference ID (Recommended)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR1234567890 or Bank Reference No"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  This reference number will be sent in the rider's notification bell.
                </span>
              </div>

              {/* Admin Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Admin Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sent via PhonePe Business or HDFC Netbanking"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                onClick={closeModal}
                disabled={processing}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
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

      {/* Reject Modal */}
      {modalType === "reject" && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <XCircle className="text-rose-600" size={22} />
                Reject Payout Request
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">
                ×
              </button>
            </div>

            <div className="my-5 space-y-4 text-sm">
              <p className="text-gray-600">
                Are you sure you want to reject the payout request of{" "}
                <span className="font-bold text-gray-900">
                  ₹{Number(selectedRequest.amount).toLocaleString()}
                </span>{" "}
                for{" "}
                <span className="font-bold text-gray-900">
                  {selectedRequest.user?.name || selectedRequest.bankDetails?.accountHolder}
                </span>
                ?
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Invalid bank details, Suspicious activity, Order audit pending..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                onClick={closeModal}
                disabled={processing}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                {processing ? <RefreshCw size={16} className="animate-spin" /> : <XCircle size={16} />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {modalType === "details" && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Payout Request Details
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">
                ×
              </button>
            </div>

            <div className="my-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border">
                <div>
                  <span className="text-xs text-gray-400 block">Rider Name</span>
                  <span className="font-semibold text-gray-800">
                    {selectedRequest.user?.name || selectedRequest.bankDetails?.accountHolder}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Mobile</span>
                  <span className="font-semibold text-gray-800">{selectedRequest.user?.mobile || selectedRequest.bankDetails?.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Rider ID</span>
                  <span className="font-mono text-xs font-semibold text-gray-700">
                    {selectedRequest.riderId || selectedRequest.user?._id}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Amount</span>
                  <span className="font-bold text-emerald-700 text-base">
                    ₹{Number(selectedRequest.amount).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Paid Via</span>
                  <span className="uppercase font-bold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {selectedRequest.paidVia || selectedRequest.method || "UPI"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Status</span>
                  <span className="capitalize font-semibold text-xs text-gray-800">
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              {/* Full Bank & UPI Details */}
              <div className="p-4 bg-gray-50 rounded-xl border space-y-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Rider Payout Coordinates:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block">UPI ID:</span>
                    <span className="font-mono font-bold text-gray-900">{selectedRequest.bankDetails?.upiId || selectedRequest.user?.upi || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Account Number:</span>
                    <span className="font-mono font-bold text-gray-900">{selectedRequest.bankDetails?.accountNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">IFSC Code:</span>
                    <span className="font-mono font-bold text-gray-900">{selectedRequest.bankDetails?.ifsc || selectedRequest.bankDetails?.ifscCode || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Bank Name:</span>
                    <span className="font-semibold text-gray-900">{selectedRequest.bankDetails?.bankName || "N/A"}</span>
                  </div>
                </div>
              </div>

              {selectedRequest.utrNumber && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                  <span className="font-semibold text-emerald-800 block">UTR / Transaction Ref:</span>
                  <span className="font-mono text-emerald-900 font-bold">{selectedRequest.utrNumber}</span>
                </div>
              )}

              {selectedRequest.adminNote && (
                <div className="p-3 bg-gray-50 rounded-xl border text-xs">
                  <span className="font-semibold text-gray-600 block">Admin Note / Reason:</span>
                  <span className="text-gray-800">{selectedRequest.adminNote}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-gray-400 pt-2">
                <span>Requested: {new Date(selectedRequest.createdAt).toLocaleString()}</span>
                {selectedRequest.processedAt && (
                  <span>Processed: {new Date(selectedRequest.processedAt).toLocaleString()}</span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={closeModal}
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

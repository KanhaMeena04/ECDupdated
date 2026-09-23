import React, { useState } from "react";
import { Alert } from "@mui/material";
import { Landmark, QrCode, ChevronLeft, CheckCircle2, ShieldCheck, CreditCard, Building } from "lucide-react";

const popularBanks = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank (PNB)",
  "Bank of Baroda",
  "Kotak Mahindra Bank",
  "Canara Bank",
  "Union Bank of India",
  "IndusInd Bank",
  "Paytm Payments Bank",
  "Airtel Payments Bank",
  "Other Bank",
];

const RiderBankDetailsForm = ({
  formData,
  handleNestedChange,
  prevStep,
  submitRider,
  loading,
}) => {
  const [error, setError] = useState("");

  const bank = formData.bankDetails || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (bank.accountNumber && bank.confirmAccountNumber) {
      if (bank.accountNumber !== bank.confirmAccountNumber) {
        setError("Account Number and Confirm Account Number do not match!");
        return;
      }
    }

    try {
      await submitRider();
    } catch (err) {
      setError(err.message || "Failed to create rider. Please check all fields.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
          <Landmark size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Bank & UPI Payout Details</h2>
          <p className="text-xs text-gray-500">
            Configure rider bank account and UPI ID for seamless automated earnings withdrawal & payouts
          </p>
        </div>
      </div>

      {error && (
        <Alert severity="error" className="mb-6 rounded-lg">
          {error}
        </Alert>
      )}

      {/* Auto Approval Info Box */}
      <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
        <ShieldCheck size={24} className="text-emerald-600 flex-shrink-0" />
        <div className="text-xs text-emerald-800">
          <span className="font-bold">Instant Auto-Approval: </span>
          When created by Admin, this Rider's account, documents, and payout methods are automatically marked as verified and approved so they can start delivering immediately.
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* UPI ID (Virtual Payment Address) */}
          <div className="md:col-span-2 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
            <div className="flex items-center gap-2 mb-2">
              <QrCode size={18} className="text-teal-700" />
              <label className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                UPI ID / VPA (For Instant Payouts)
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                value={bank.upiId || ""}
                onChange={(e) => handleNestedChange("bankDetails", "upiId", e.target.value.trim())}
                placeholder="e.g. 9876543210@paytm or rider@okhdfcbank"
                className="w-full px-4 py-2.5 bg-white border border-teal-300 rounded-lg text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <p className="text-[11px] text-teal-700 mt-1">
              Supported: Google Pay, PhonePe, Paytm, BHIM, Bank UPI handles
            </p>
          </div>

          {/* Account Holder Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Account Holder Name
            </label>
            <div className="relative">
              <Building size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={bank.holderName || bank.accountHolderName || formData.name || ""}
                onChange={(e) => {
                  handleNestedChange("bankDetails", "holderName", e.target.value);
                  handleNestedChange("bankDetails", "accountHolderName", e.target.value);
                }}
                placeholder={formData.name || "Enter Holder Name"}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
            </div>
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Bank Name
            </label>
            <select
              value={bank.bankName || ""}
              onChange={(e) => handleNestedChange("bankDetails", "bankName", e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            >
              <option value="">Select Bank Name</option>
              {popularBanks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Bank Account Number
            </label>
            <div className="relative">
              <CreditCard size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={bank.accountNumber || ""}
                onChange={(e) => handleNestedChange("bankDetails", "accountNumber", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 123456789012"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
            </div>
          </div>

          {/* Confirm Account Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Confirm Account Number
            </label>
            <div className="relative">
              <CreditCard size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={bank.confirmAccountNumber || ""}
                onChange={(e) => handleNestedChange("bankDetails", "confirmAccountNumber", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Re-enter Account Number"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
            </div>
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              IFSC Code
            </label>
            <input
              type="text"
              maxLength={11}
              value={bank.ifscCode || ""}
              onChange={(e) => handleNestedChange("bankDetails", "ifscCode", e.target.value.toUpperCase().trim())}
              placeholder="e.g. SBIN0001234"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm uppercase text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition font-mono"
            />
          </div>

          {/* Branch Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Branch Name (Optional)
            </label>
            <input
              type="text"
              value={bank.branchName || ""}
              onChange={(e) => handleNestedChange("bankDetails", "branchName", e.target.value)}
              placeholder="e.g. Main Branch, Jaipur"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            />
          </div>
        </div>

        {/* Navigation & Submit Buttons */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={prevStep}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-9 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-emerald-200 transition ${
              loading ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <span>Creating & Approving Rider...</span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Create & Approve Rider</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RiderBankDetailsForm;
import React from "react";
import { FileText, Upload, ChevronLeft, ChevronRight, CheckCircle2, Calendar, CreditCard, Shield } from "lucide-react";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });

const RiderDocumentForm = ({
  formData,
  handleNestedChange,
  handleDocumentChange,
  nextStep,
  prevStep,
}) => {
  const handleFileUpload = async (key, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      handleDocumentChange(key, base64);
    }
  };

  const docs = formData.documents || {};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
          <FileText size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">KYC & Legal Documents</h2>
          <p className="text-xs text-gray-500">
            Enter document numbers and upload images (Admin auto-approves uploaded documents)
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* 1. Driving License */}
        <div className="p-5 bg-gray-50/70 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-800">1. Driving License (DL)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                License Number
              </label>
              <input
                type="text"
                value={docs.licenseNumber || ""}
                onChange={(e) => handleDocumentChange("licenseNumber", e.target.value.toUpperCase())}
                placeholder="DL1420110012345"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm uppercase outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                License Expiry Date
              </label>
              <input
                type="date"
                value={docs.licenseExpiry || ""}
                onChange={(e) => handleDocumentChange("licenseExpiry", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                License Front Photo
              </label>
              <label className="flex items-center justify-between px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                <span className="truncate">
                  {docs.licenseFront ? "✅ Photo Selected" : "Upload Front"}
                </span>
                <Upload size={14} className="text-gray-400" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload("licenseFront", e)} />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                License Back Photo
              </label>
              <label className="flex items-center justify-between px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                <span className="truncate">
                  {docs.licenseBack ? "✅ Photo Selected" : "Upload Back"}
                </span>
                <Upload size={14} className="text-gray-400" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload("licenseBack", e)} />
              </label>
            </div>
          </div>
        </div>

        {/* 2. Registration Certificate (RC) */}
        <div className="p-5 bg-gray-50/70 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-800">2. Vehicle Registration Certificate (RC)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                RC Number
              </label>
              <input
                type="text"
                value={docs.rcNumber || formData.vehicle?.number || ""}
                onChange={(e) => handleDocumentChange("rcNumber", e.target.value.toUpperCase())}
                placeholder="RJ14 AB 1234"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm uppercase outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                RC Document / Card Photo
              </label>
              <label className="flex items-center justify-between px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                <span className="truncate">
                  {docs.rcImage ? "✅ RC Photo Selected" : "Upload RC Photo"}
                </span>
                <Upload size={14} className="text-gray-400" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload("rcImage", e)} />
              </label>
            </div>
          </div>
        </div>

        {/* 3. Aadhaar & PAN Card */}
        <div className="p-5 bg-gray-50/70 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-800">3. Identity Documents (Aadhaar & PAN Card)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                Aadhaar Number (12 Digits)
              </label>
              <input
                type="text"
                maxLength={12}
                value={docs.aadharNumber || ""}
                onChange={(e) => handleDocumentChange("aadharNumber", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="1234 5678 9012"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                Aadhaar Photo
              </label>
              <label className="flex items-center justify-between px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                <span className="truncate">
                  {docs.aadharFront ? "✅ Photo Selected" : "Upload Aadhaar"}
                </span>
                <Upload size={14} className="text-gray-400" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload("aadharFront", e)} />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                PAN Number (10 Chars)
              </label>
              <input
                type="text"
                maxLength={10}
                value={docs.panNumber || ""}
                onChange={(e) => handleDocumentChange("panNumber", e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm uppercase outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                PAN Card Photo
              </label>
              <label className="flex items-center justify-between px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                <span className="truncate">
                  {docs.panImage ? "✅ Photo Selected" : "Upload PAN"}
                </span>
                <Upload size={14} className="text-gray-400" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload("panImage", e)} />
              </label>
            </div>
          </div>
        </div>

        {/* 4. Vehicle Insurance */}
        <div className="p-5 bg-gray-50/70 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-800">4. Vehicle Insurance Policy (Optional)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                Policy Number
              </label>
              <input
                type="text"
                value={docs.insuranceNumber || ""}
                onChange={(e) => handleDocumentChange("insuranceNumber", e.target.value.toUpperCase())}
                placeholder="POL-12345678"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                Policy Expiry Date
              </label>
              <input
                type="date"
                value={docs.insuranceExpiry || ""}
                onChange={(e) => handleDocumentChange("insuranceExpiry", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                Policy Certificate Photo
              </label>
              <label className="flex items-center justify-between px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                <span className="truncate">
                  {docs.insuranceImage ? "✅ Photo Selected" : "Upload Insurance"}
                </span>
                <Upload size={14} className="text-gray-400" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload("insuranceImage", e)} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <ChevronLeft size={18} />
          <span>Previous</span>
        </button>

        <button
          type="button"
          onClick={nextStep}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-8 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-emerald-200 transition"
        >
          <span>Next: Bank & UPI Payout</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default RiderDocumentForm;

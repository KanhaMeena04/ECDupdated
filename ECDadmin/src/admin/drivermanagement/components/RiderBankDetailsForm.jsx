import React, { useState } from "react";
import { ChevronLeft, ChevronRight,  } from "lucide-react";

const RiderBankDetailsForm = ({
  formData,
  handleNestedChange,
  prevStep,
  submitRider,
  loading,
}) => {
  const steps = ["Driver Details", "Document Settings", "Bank Details"];
  const activeStep = 2; // Step 3

  const fields = [
    { label: "Account Name*", key: "accountName", placeholder: "Enter Account Name" },
    { label: "Bank Name*", key: "bankName", placeholder: "Enter Bank Name" },
    { label: "Account Address*", key: "accountAddress", placeholder: "Enter Account Address" },
    { label: "Branch Name*", key: "branchName", placeholder: "Enter Branch Name" },
    { label: "Account Number*", key: "accountNumber", placeholder: "Enter Account Number" },
    { label: "Branch Address*", key: "branchAddress", placeholder: "Enter Branch Address" },
    { label: "Swift Code", key: "swiftCode", placeholder: "Enter Swift Code" },
    { label: "Routing Number", key: "routingNumber", placeholder: "Enter Routing Number" },
  ];

  return (
    <div className="min-h-screen bg-white p-4 font-sans">
      {/* --- Custom Stepper --- */}
      <div className="max-w-7xl mx-auto flex items-center gap-4 mb-10 text-sm">
        {steps.map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded flex items-center justify-center font-bold transition-all ${
                index === activeStep
                  ? "bg-[#00A982] text-white shadow-lg shadow-teal-100"
                  : index < activeStep
                  ? "bg-teal-50 text-[#00A982]"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {index + 1}
            </div>
            <span className={`${index === activeStep ? "text-[#00A982] font-semibold" : "text-gray-400"}`}>
              {label}
            </span>
            {index < steps.length - 1 && <ChevronRight size={14} className="text-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
       

        {/* --- Form Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-gray-500">
                {field.label}
              </label>
              <input
                type="text"
                placeholder={field.placeholder}
                className="w-full border border-gray-200 rounded-md h-11 px-4 text-sm focus:outline-none focus:border-[#00A982] focus:ring-1 focus:ring-teal-50 transition-all placeholder:text-gray-300"
                value={formData.bankDetails?.[field.key] || ""}
                onChange={(e) =>
                  handleNestedChange("bankDetails", field.key, e.target.value)
                }
              />
            </div>
          ))}
        </div>

        {/* --- Footer Buttons --- */}
        <div className="mt-16 flex justify-between items-center">
          <button
            onClick={prevStep}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <ChevronLeft size={18} />
            Previous
          </button>
          
          <button
            onClick={submitRider}
            disabled={loading}
            className={`flex items-center gap-2 px-10 py-2.5 bg-[#00A982] text-white rounded-md text-sm font-semibold hover:bg-[#008f6e] transition-all ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Submitting..." : "Submit"}
            {!loading && <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiderBankDetailsForm;
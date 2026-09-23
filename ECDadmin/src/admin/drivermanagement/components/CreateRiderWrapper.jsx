import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Bike, FileText, Landmark, Check, ChevronRight } from "lucide-react";
import AdminCreateRiderForm from "./AdminCreateRiderForm";
import RiderVehicleForm from "./RiderVehicleForm";
import RiderDocumentForm from "./RiderDocumentForm";
import RiderBankDetailsForm from "./RiderBankDetailsForm";
import { useCreateRider } from "../../api/driver.js";

const steps = [
  { id: 0, label: "Driver & PIN", icon: User, desc: "Personal info & 4-Digit Security PIN" },
  { id: 1, label: "Vehicle Info", icon: Bike, desc: "Vehicle type, plate & model" },
  { id: 2, label: "KYC Documents", icon: FileText, desc: "License, RC, Aadhaar & PAN" },
  { id: 3, label: "Bank & UPI", icon: Landmark, desc: "Payout account & UPI details" },
];

const CreateRiderWrapper = () => {
  const navigate = useNavigate();
  const {
    formData,
    activeStep,
    loading,
    status,
    handleChange,
    handleNestedChange,
    handleDocumentChange,
    setFieldValue,
    nextStep,
    prevStep,
    goToStep,
    submitRider,
  } = useCreateRider();

  const handleFinalSubmit = async () => {
    const res = await submitRider();
    // After 1.5 seconds, navigate to driver list
    setTimeout(() => {
      navigate("/driver-list");
    }, 1200);
    return res;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* --- Modern Stepper --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {steps.map((step, index) => {
            const isCompleted = activeStep > index;
            const isCurrent = activeStep === index;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (index < activeStep) goToStep(index);
                }}
                disabled={index > activeStep}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                  isCurrent
                    ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-100 shadow-sm"
                    : isCompleted
                    ? "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/50 cursor-pointer"
                    : "border-gray-200 bg-gray-50/70 opacity-60 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                      Step {index + 1}
                    </span>
                  </div>
                  <div
                    className={`text-xs font-bold truncate ${
                      isCurrent ? "text-emerald-900" : isCompleted ? "text-gray-800" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Step Forms --- */}
      <div>
        {activeStep === 0 && (
          <AdminCreateRiderForm
            formData={formData}
            loading={loading}
            status={status}
            handleChange={handleChange}
            handleNestedChange={handleNestedChange}
            setFieldValue={setFieldValue}
            nextStep={nextStep}
            goToStep={goToStep}
          />
        )}

        {activeStep === 1 && (
          <RiderVehicleForm
            formData={formData}
            handleNestedChange={handleNestedChange}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}

        {activeStep === 2 && (
          <RiderDocumentForm
            formData={formData}
            handleNestedChange={handleNestedChange}
            handleDocumentChange={handleDocumentChange}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}

        {activeStep === 3 && (
          <RiderBankDetailsForm
            formData={formData}
            handleNestedChange={handleNestedChange}
            prevStep={prevStep}
            submitRider={handleFinalSubmit}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default CreateRiderWrapper;

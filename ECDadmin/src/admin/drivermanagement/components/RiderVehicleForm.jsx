import React, { useState } from "react";
import { Alert } from "@mui/material";
import { Bike, Car, ChevronLeft, ChevronRight, Hash, Sparkles, Calendar, Palette } from "lucide-react";

const vehicleTypes = [
  { id: "bike", label: "Motorcycle / Bike", icon: Bike },
  { id: "scooter", label: "Scooter", icon: Bike },
  { id: "ev", label: "Electric Vehicle (EV)", icon: Bike },
  { id: "car", label: "Car", icon: Car },
  { id: "bicycle", label: "Bicycle", icon: Bike },
  { id: "other", label: "Other", icon: Bike },
];

const popularBrands = [
  "Honda",
  "Hero",
  "TVS",
  "Bajaj",
  "Yamaha",
  "Suzuki",
  "Royal Enfield",
  "Ather",
  "Ola Electric",
  "Other",
];

const RiderVehicleForm = ({
  formData,
  handleNestedChange,
  nextStep,
  prevStep,
}) => {
  const [error, setError] = useState("");

  const handleNext = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.vehicle?.number && !formData.vehicle?.regNumber) {
      setError("Please enter the Vehicle Registration / Plate Number (e.g. RJ14 AB 1234)");
      return;
    }

    nextStep();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
          <Bike size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Vehicle Information</h2>
          <p className="text-xs text-gray-500">
            Specify the vehicle model, brand, and registration number plate
          </p>
        </div>
      </div>

      {error && (
        <Alert severity="warning" className="mb-6 rounded-lg">
          {error}
        </Alert>
      )}

      <form onSubmit={handleNext}>
        {/* Vehicle Type Selector Cards */}
        <div className="mb-8">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Select Vehicle Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {vehicleTypes.map((v) => {
              const isSelected = (formData.vehicle?.type || "bike") === v.id;
              const Icon = v.icon;
              return (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => handleNestedChange("vehicle", "type", v.id)}
                  className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/70 text-emerald-800 shadow-sm"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100/70"
                  }`}
                >
                  <Icon size={22} className={isSelected ? "text-emerald-600" : "text-gray-500"} />
                  <span className="text-xs font-semibold text-center">{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Vehicle Number Plate */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Registration / Plate Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={formData.vehicle?.number || formData.vehicle?.regNumber || ""}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  handleNestedChange("vehicle", "number", val);
                  handleNestedChange("vehicle", "regNumber", val);
                }}
                placeholder="RJ14 AB 1234"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold tracking-wider text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition uppercase"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Format: State code + Number (e.g. DL01AB1234)</p>
          </div>

          {/* Vehicle Brand / Make */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Vehicle Brand / Make
            </label>
            <select
              value={formData.vehicle?.brand || ""}
              onChange={(e) => handleNestedChange("vehicle", "brand", e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            >
              <option value="">Select Brand</option>
              {popularBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Model */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Vehicle Model
            </label>
            <div className="relative">
              <Sparkles size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={formData.vehicle?.model || ""}
                onChange={(e) => handleNestedChange("vehicle", "model", e.target.value)}
                placeholder="e.g. Activa 6G, Splendor+"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
            </div>
          </div>

          {/* Vehicle Color */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Vehicle Color
            </label>
            <div className="relative">
              <Palette size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={formData.vehicle?.color || ""}
                onChange={(e) => handleNestedChange("vehicle", "color", e.target.value)}
                placeholder="e.g. Black, Blue, Red"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
            </div>
          </div>

          {/* Manufacturing Year */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Manufacturing Year
            </label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                maxLength={4}
                value={formData.vehicle?.year || ""}
                onChange={(e) => handleNestedChange("vehicle", "year", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="2023"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
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
            type="submit"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-8 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-emerald-200 transition"
          >
            <span>Next: KYC Documents</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default RiderVehicleForm;

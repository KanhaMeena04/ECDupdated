import React, { useState } from "react";
import { Alert } from "@mui/material";
import { KeyRound, Smartphone, Mail, User, MapPin, Upload, Image, ShieldCheck } from "lucide-react";
import { useCities } from "../../api/city";
import { useZones } from "../../api/zone";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });

const AdminCreateRiderForm = ({
  formData,
  loading,
  status,
  handleChange,
  handleNestedChange,
  setFieldValue,
  nextStep,
  goToStep,
}) => {
  const [validationError, setValidationError] = useState("");

  const { cities: citiesData = [], loading: citiesLoading } = useCities();
  const { zones: zonesData = [], loading: zonesLoading } = useZones();

  const cityOptions = citiesData.map((c) => ({ _id: c._id, name: c.name }));
  const zoneOptions = zonesData.map((z) => ({ _id: z._id, name: z.name }));

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setFieldValue("profilePic", base64);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.name?.trim()) {
      setValidationError("Please enter Driver's Full Name");
      return;
    }

    const cleanPhone = (formData.mobile || "").replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      setValidationError("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!formData.pin || formData.pin.toString().trim().length !== 4) {
      setValidationError("Please set a 4-digit Security PIN for Rider App login (e.g. 1234)");
      return;
    }

    nextStep();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      {/* Status / Validation Alerts */}
      {status?.msg && (
        <Alert severity={status.type || "info"} className="mb-6 rounded-lg">
          {status.msg}
        </Alert>
      )}

      {validationError && (
        <Alert severity="warning" className="mb-6 rounded-lg">
          {validationError}
        </Alert>
      )}

      <form onSubmit={handleFormSubmit}>
        {/* Section Header */}
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Driver Personal & Security Details</h2>
            <p className="text-xs text-gray-500">
              Basic info, Mobile number, and 4-Digit PIN for instant Rider App Login
            </p>
          </div>
        </div>

        {/* 4-Digit Security PIN Highlight Banner */}
        <div className="mb-8 p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-xl border border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 flex-shrink-0">
              <KeyRound size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-900">4-Digit Security PIN (App Login)</span>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 text-[10px] font-semibold rounded-full uppercase">
                  Important
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                Rider can immediately login in the Rider Mobile App using this 4-Digit PIN or OTP.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <input
              type="text"
              maxLength={4}
              value={formData.pin || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setFieldValue("pin", val);
              }}
              placeholder="1234"
              className="w-36 tracking-widest text-center text-lg font-bold bg-white border-2 border-emerald-500 text-emerald-800 rounded-lg py-2 px-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Driver Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Driver Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Mobile Number (10 Digits) <span className="text-red-500">*</span>
            </label>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition bg-gray-50">
              <span className="px-3 py-2.5 bg-gray-100 border-r border-gray-200 text-sm font-semibold text-gray-600 flex items-center gap-1">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                name="mobile"
                maxLength={10}
                value={formData.mobile || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setFieldValue("mobile", val);
                }}
                placeholder="9876543210"
                required
                className="w-full px-3 py-2.5 bg-transparent text-sm text-gray-800 outline-none font-medium"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Email Address (Optional)
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="email"
                name="email"
                autoComplete="new-password"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder="rider@ecdkart.com"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
            </div>
          </div>

          {/* Password (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Password (Optional)
            </label>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={formData.password || ""}
              onChange={handleChange}
              placeholder="Leave blank to use PIN"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Account Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status || "pending"}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            >
              <option value="pending">Pending Verification (Default)</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Profile Picture Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Driver Photo / Avatar
            </label>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {formData.profilePic ? (
                  <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Image size={20} className="text-gray-400" />
                )}
              </div>
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-700 cursor-pointer transition">
                <Upload size={14} />
                <span>{formData.profilePic ? "Change Photo" : "Upload Photo"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
              </label>
            </div>
          </div>

          {/* Address Line 1 */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                placeholder="House / Flat No., Street, Area"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
            </div>
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Address Line 2 (Landmark)
            </label>
            <input
              type="text"
              name="address2"
              value={formData.address2 || ""}
              onChange={handleChange}
              placeholder="Near Landmark, Sector"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <select
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            >
              <option value="">Select City</option>
              {cityOptions.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Work City */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Work / Delivery City
            </label>
            <select
              name="workCity"
              value={formData.workCity || ""}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            >
              <option value="">Select Work City</option>
              {cityOptions.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Work Zones */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Assigned Delivery Zone
            </label>
            <select
              name="workZone"
              value={formData.workZone || ""}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            >
              <option value="">Select Delivery Zone</option>
              {zoneOptions.map((z) => (
                <option key={z._id} value={z.name}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* Zip Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Pin / Zip Code
            </label>
            <input
              type="text"
              name="zipCode"
              maxLength={6}
              value={formData.zipCode || ""}
              onChange={handleChange}
              placeholder="302001"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end mt-10 pt-6 border-t border-gray-100">
          <button
            type="submit"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-8 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-emerald-200 transition"
          >
            <span>Next: Vehicle Details</span>
            <span>→</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateRiderForm;

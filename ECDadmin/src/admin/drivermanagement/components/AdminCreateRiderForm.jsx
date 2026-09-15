import React from "react";
import {
  TextField,
  Button,
  Alert,
} from "@mui/material";

import { useRestaurantNameList } from "../../api/restaurant";
import { useCities } from "../../api/city";
import { useZones } from "../../api/zone";

const AdminCreateRiderForm = ({
  formData,
  loading,
  status,
  handleChange,
  handleNestedChange,
  nextStep,
}) => {

  const {
    restaurants = [],
    loading: restaurantsLoading,
    error: restaurantError,
  } = useRestaurantNameList();

  const {
    cities: citiesData = [],
    loading: citiesLoading,
    error: citiesError,
  } = useCities();

  const {
    zones: zonesData = [],
    loading: zonesLoading,
    error: zonesError,
  } = useZones();

  // Transform data for selects
  const restaurantOptions = restaurants.map((r) => ({ _id: r._id, name: r.name }));
  const cityOptions = citiesData.map((c) => ({ _id: c._id, name: c.name ,state:c.state,country:c.country}));
  const zoneOptions = zonesData.map((z) => ({ _id: z._id, name: z.name }));

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">

        {/* Stepper */}
        <div className="flex items-center gap-6 mb-6">
          <Step active step={1} label="Driver Details" />
          <Step step={2} label="Document Settings" />
          <Step step={3} label="Bank Details" />
        </div>

        {/* Status Alert */}
        {status?.msg && (
          <Alert severity={status.type} className="mb-6">
            {status.msg}
          </Alert>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            nextStep();
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            <TextSelect
              label="Restaurant (Optional)"
              options={restaurantOptions}
              name="restaurant"
              value={formData.restaurant || ""}
              onChange={handleChange}
              loading={restaurantsLoading}
              error={restaurantError}
            />

            <TextSelect
              label="Vehicle Name*"
              options={[
                { _id: "bike", name: "Bike / Scooter" },
                { _id: "cycle", name: "Bicycle" },
                { _id: "car", name: "Car" },
              ]}
              name="vehicleType"
              value={formData.vehicle.type}
              onChange={(e) => handleNestedChange("vehicle", "type", e.target.value)}
            />

            <InputField
              label="Driver Name*"
              value={formData.name}
              name="name"
              onChange={handleChange}
            />

            <PhoneInputField value={formData.mobile} onChange={handleChange} />

            <InputField
              label="Email*"
              value={formData.email}
              name="email"
              onChange={handleChange}
              type="email"
            />

            <InputField
              label="Address Line1*"
              value={formData.address}
              name="address"
              onChange={handleChange}
            />
            <InputField
              label="Address Line2"
              value={formData.address2 || ""}
              name="address2"
              onChange={handleChange}
            />

            <TextSelect
              label="Select Country*"
              options={cityOptions}
              name="country"
              value={formData.country || ""}
              onChange={handleChange}
            />
            <TextSelect
              label="Select State"
              options={cityOptions}
              name="state"
              value={formData.state || ""}
              onChange={handleChange}
              loading={citiesLoading}
              error={citiesError}
            />

            {/* City & Work City */}
            <TextSelect
              label="Select City*"
              options={cityOptions}
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
              loading={citiesLoading}
              error={citiesError}
            />
            <TextSelect
              label="Work City"
              options={cityOptions}
              name="workCity"
              value={formData.workCity || ""}
              onChange={handleChange}
              loading={citiesLoading}
              error={citiesError}
            />

            {/* ZipCode */}
            <InputField
              label="ZipCode*"
              value={formData.zipCode || ""}
              name="zipCode"
              onChange={handleChange}
            />

            {/* Work Zones */}
            <TextSelect
              label="Work Zones"
              options={zoneOptions}
              name="workZone"
              value={formData.workZone || ""}
              onChange={handleChange}
              loading={zonesLoading}
              error={zonesError}
            />

            {/* Avatar */}
            <div>
              <label className="text-sm font-medium text-gray-600">Profile</label>
              <div className="border rounded-md p-2 flex justify-between items-center mt-1">
                <span className="text-gray-400 text-sm">
                  Choose a file or drop it here...
                </span>
                <button className="border px-3 py-1 rounded text-sm" type="button">
                  Browse
                </button>
              </div>
              <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center mt-3 text-gray-400">
                🖼️
              </div>
            </div>

            {/* Passwords */}
            <InputField
              label="Password"
              type="password"
              value={formData.password}
              name="password"
              onChange={handleChange}
            />
            <InputField
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword || ""}
              name="confirmPassword"
              onChange={handleChange}
            />

            {/* Status */}
            <TextSelect
              label="Status*"
              options={[
                { _id: "active", name: "Active" },
                { _id: "inactive", name: "Inactive" },
              ]}
              name="status"
              value={formData.status || ""}
              onChange={handleChange}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Next →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- Reusable Components ---------------- */

function Step({ step, label, active }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-medium
        ${active ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}
      >
        {step}
      </div>
      <span className={`text-sm ${active ? "text-emerald-600 font-medium" : "text-gray-500"}`}>
        {label}
      </span>
    </div>
  );
}

function InputField({ label, placeholder, value, name, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder || label}
        value={value}
        onChange={onChange}
        className="w-full border rounded-md px-3 py-2 mt-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
      />
    </div>
  );
}

function TextSelect({ label, options, value, onChange, name, loading, error }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={loading}
        className="w-full border rounded-md px-3 py-2 mt-1 text-sm text-gray-500"
      >
        <option>{loading ? "Loading..." : `Select ${label}`}</option>
        {options.map((opt) => (
          <option key={opt._id} value={opt._id}>
            {opt.name}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function PhoneInputField({ value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">Phone No</label>
      <div className="flex border rounded-md mt-1 overflow-hidden">
        <select className="px-2 border-r bg-gray-50 text-sm">
          <option>🇮🇳 +91</option>
        </select>
        <input
          placeholder="Phone number"
          name="mobile"
          value={value}
          onChange={onChange}
          className="flex-1 px-3 py-2 text-sm outline-none"
        />
      </div>
    </div>
  );
}

export default AdminCreateRiderForm;

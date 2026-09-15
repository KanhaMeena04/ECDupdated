import React, { useState } from "react";
import {
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Button,
  Checkbox,
  FormGroup,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useCreatePromocode } from "../../api/promocode.js";
import { useNavigate } from 'react-router-dom';
import { useRestaurantNameList } from "../../api/restaurant.js";

const AddPromocodeForm = () => {
  const { createPromocode, loading } = useCreatePromocode();
  const navigate = useNavigate();
  const { restaurants, loading: rLoading } = useRestaurantNameList();

  const [form, setForm] = useState({
    title: "",
    description: "",
    code: "",
    image: null,
    restaurant: "",
    offerType: "percent",
    discountValue: "",
    maxDiscountAmount: "",
    minOrderValue: "",
    adminContribution: "",
    usageLimitPerCoupon: "",
    usageLimitPerUser: "",
    availableFrom: null,
    expiryDate: null,
    promoType: "public",
    paymentMethods: ["all"],
    isTimeBound: false,
    activeDays: [],
    timeSlots: [],
    status: "active",
  });

  const days = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (day) => {
    setForm((prev) => {
      let activeDays = prev.activeDays || [];

      if (day === 'All') {
        // toggle All: if selecting All, replace with ['All'], else clear
        activeDays = activeDays.includes('All') ? [] : ['All'];
      } else {
        // if All was selected, remove it when selecting specific days
        if (activeDays.includes('All')) {
          activeDays = [];
        }

        activeDays = activeDays.includes(day)
          ? activeDays.filter((d) => d !== day)
          : [...activeDays, day];
      }

      return { ...prev, activeDays };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      code: form.code.toUpperCase(),
      restaurant: form.restaurant || null,
    };
    const result = await createPromocode(data);
    if (result) {
      navigate('/promocodes');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        <TextField
          fullWidth
          label="Title*"
          size="small"
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
        />
        <TextField
          fullWidth
          label="Description*"
          multiline
          rows={1}
          size="small"
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />
        <FormControl fullWidth size="small">
          <InputLabel>Offer Type*</InputLabel>
          <Select
            value={form.offerType}
            onChange={(e) => handleChange("offerType", e.target.value)}
          >
            <MenuItem value="percent">Percentage</MenuItem>
            <MenuItem value="amount">Flat Amount</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Minimum Order Value*"
          type="number"
          size="small"
          value={form.minOrderValue}
          onChange={(e) => handleChange("minOrderValue", e.target.value)}
        />
        <TextField
          fullWidth
          label="Admin Contribution"
          size="small"
          value={form.adminContribution}
          onChange={(e) => handleChange("adminContribution", e.target.value)}
        />
        <TextField
          fullWidth
          label="Usage Limit Per User*"
          size="small"
          value={form.usageLimitPerUser}
          onChange={(e) => handleChange("usageLimitPerUser", e.target.value)}
        />
        <DatePicker
          label="Expiry Date *"
          value={form.expiryDate}
          onChange={(newValue) => handleChange("expiryDate", newValue)}
          slotProps={{ textField: { fullWidth: true, size: "small" } }}
        />
        <FormControl fullWidth size="small">
          <InputLabel>Promocode Type</InputLabel>
          <Select
            value={form.promoType}
            onChange={(e) => handleChange("promoType", e.target.value)}
          >
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </Select>
        </FormControl>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <FormControl fullWidth size="small">
          <InputLabel>Restaurant</InputLabel>
          <Select
            value={form.restaurant}
            label="Restaurant"
            onChange={(e) => handleChange("restaurant", e.target.value)}
            disabled={rLoading}
          >
            <MenuItem value="" disabled>
              Select Restaurant
            </MenuItem>
            {restaurants?.map((r) => (
              <MenuItem key={r._id} value={r._id}>
                {r.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Promocode*"
          size="small"
          value={form.code}
          onChange={(e) => handleChange("code", e.target.value)}
        />
        <TextField
          fullWidth
          label="Maximum Amount*"
          type="number"
          size="small"
          value={form.maxDiscountAmount}
          onChange={(e) => handleChange("maxDiscountAmount", e.target.value)}
        />
        <TextField
          fullWidth
          label="Discount (%)*"
          type="number"
          size="small"
          value={form.discountValue}
          onChange={(e) => handleChange("discountValue", e.target.value)}
        />
        <TextField
          fullWidth
          label="Usage Limit Per Coupon*"
          size="small"
          value={form.usageLimitPerCoupon}
          onChange={(e) => handleChange("usageLimitPerCoupon", e.target.value)}
        />
        <DatePicker
          label="Available From*"
          value={form.availableFrom}
          onChange={(newValue) => handleChange("availableFrom", newValue)}
          slotProps={{ textField: { fullWidth: true, size: "small" } }}
        />
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Payment Methods</InputLabel>
          <Select
            value={form.paymentMethods}
            onChange={(e) => {
              const val = e.target.value;
              // ensure array
              handleChange("paymentMethods", Array.isArray(val) ? val : [val]);
            }}
            multiple
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="card">Card Only</MenuItem>
          </Select>
        </FormControl>

        <div>
          <label className="text-sm text-gray-500 font-medium">Active Days</label>
          <FormGroup row>
            {days.map((d) => (
              <FormControlLabel
                key={d}
                control={
                  <Checkbox
                    checked={form.activeDays.includes(d)}
                    onChange={() => handleCheckboxChange(d)}
                  />
                }
                label={d}
              />
            ))}
          </FormGroup>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-10 col-span-2">
        <Button
          variant="contained"
          size="large"
          type="submit"
          disabled={loading}
          sx={{ px: 6, bgcolor: "#00a693", "&:hover": { bgcolor: "#008a7a" } }}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};

export default AddPromocodeForm;

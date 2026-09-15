import React, { useEffect, useState } from "react";
import {
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";

import { useRestaurantNameList } from "../../api/restaurant";
import {
  usePromocodeDetails,
  usePromocodeList,
} from "../../api/promocode";

const EditPromocodeForm = () => {
  const { id } = useParams(); // promocode id
  const navigate = useNavigate();

  const { updatePromocode } = usePromocodeList();
  const { promocode, loading } = usePromocodeDetails(id);
  const { restaurants, loading: rLoading } = useRestaurantNameList();

  const [form, setForm] = useState({
    title: "",
    description: "",
    code: "",
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
    activeDays: [],
    status: "active",
  });

  const days = [
    "All",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  /* =======================
     PREFILL FORM (EDIT)
  ======================= */
useEffect(() => {
  if (!promocode) return;

  setForm(prev => ({
    ...prev, // keep defaults
    title: promocode.title || "",
    description: promocode.description || "",
    code: promocode.code || "",
    restaurant: promocode.restaurant?._id || "",
    offerType: promocode.offerType || "percent",
    discountValue: promocode.discountValue || "",
    maxDiscountAmount: promocode.maxDiscountAmount || "",
    minOrderValue: promocode.minOrderValue || "",
    adminContribution: promocode.adminContribution || "",
    usageLimitPerCoupon: promocode.usageLimitPerCoupon || "",
    usageLimitPerUser: promocode.usageLimitPerUser || "",
    availableFrom: promocode.availableFrom ? dayjs(promocode.availableFrom) : null,
    expiryDate: promocode.expiryDate ? dayjs(promocode.expiryDate) : null,
    promoType: promocode.promoType || "public",
    paymentMethods: Array.isArray(promocode.paymentMethods)
      ? promocode.paymentMethods
      : ["all"],
    activeDays: Array.isArray(promocode.activeDays)
      ? promocode.activeDays
      : [],
    status: promocode.status || "active",
  }));
}, [promocode]);


  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (day) => {
    setForm(prev => {
      let activeDays = prev.activeDays || [];

      if (day === "All") {
        activeDays = activeDays.includes("All") ? [] : ["All"];
      } else {
        if (activeDays.includes("All")) activeDays = [];
        activeDays = activeDays.includes(day)
          ? activeDays.filter(d => d !== day)
          : [...activeDays, day];
      }

      return { ...prev, activeDays };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await updatePromocode(id, {
      ...form,
      code: form.code.toUpperCase(),
      restaurant: form.restaurant || null,
    });

    navigate("/promocodes");
  };

  if (loading) return null; // no UI change

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* LEFT COLUMN */}
      <div className="space-y-6">
        <TextField fullWidth label="Title*" size="small"
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
        />
        <TextField fullWidth label="Description*" size="small"
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
        <TextField fullWidth label="Minimum Order Value*" size="small"
          value={form.minOrderValue}
          onChange={(e) => handleChange("minOrderValue", e.target.value)}
        />
        <TextField fullWidth label="Admin Contribution" size="small"
          value={form.adminContribution}
          onChange={(e) => handleChange("adminContribution", e.target.value)}
        />
        <TextField fullWidth label="Usage Limit Per User*" size="small"
          value={form.usageLimitPerUser}
          onChange={(e) => handleChange("usageLimitPerUser", e.target.value)}
        />
        <DatePicker
          label="Expiry Date *"
          value={form.expiryDate}
          onChange={(v) => handleChange("expiryDate", v)}
          slotProps={{ textField: { fullWidth: true, size: "small" } }}
        />
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6">
        <FormControl fullWidth size="small">
          <InputLabel>Restaurant</InputLabel>
          <Select
            value={form.restaurant}
            onChange={(e) => handleChange("restaurant", e.target.value)}
            disabled={rLoading}
          >
            {restaurants?.map(r => (
              <MenuItem key={r._id} value={r._id}>
                {r.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField fullWidth label="Promocode*" size="small"
          value={form.code}
          onChange={(e) => handleChange("code", e.target.value)}
        />

        <FormGroup row>
          {days.map(d => (
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

      <div className="col-span-2 mt-10">
        <Button
          variant="contained"
          size="large"
          type="submit"
          sx={{ px: 6, bgcolor: "#00a693" }}
        >
          Save
        </Button>
      </div>
    </form>
  );
};

export default EditPromocodeForm;

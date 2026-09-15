import React, { useState } from "react";
import {
  Tabs, Tab, Box, TextField, MenuItem,
  Select, FormControl
} from "@mui/material";
import { useCancellationReasons } from "../../api/cancellation.js";
import { useNavigate } from "react-router-dom";

const AddCancellationReasonForm = () => {
  const [tabValue, setTabValue] = useState(0);
  const { addCancellationReason } = useCancellationReasons();
  const navigate=useNavigate()

  const [formData, setFormData] = useState({
    reason: "",
    cancellationFor: "",
    status: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!formData.reason || !formData.cancellationFor || !formData.status) {
      alert("All fields are required");
      return;
    }

    const payload = {
      reason: formData.reason,
      userType: formData.cancellationFor,
      status: formData.status,
    };

    try {
      await addCancellationReason(payload);
      setFormData({ reason: "", cancellationFor: "", status: "" });
      navigate("/cancellation-reason")
    } catch {
      alert("Failed to save cancellation reason");
    }
  };

  return (
    <div className="flex justify-center  min-h-4xl bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-4xl p-8">

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500">Reason</label>
            <TextField
              fullWidth
              name="reason"
              size="small"
              value={formData.reason}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">Cancellation For</label>
            <FormControl fullWidth size="small">
              <Select
                name="cancellationFor"
                value={formData.cancellationFor}
                onChange={handleChange}
                displayEmpty
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="restaurant">Restaurant</MenuItem>
                <MenuItem value="delivery Man">Delivery Man</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div>
            <label className="text-sm text-gray-500">Status</label>
            <FormControl fullWidth size="small">
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                displayEmpty
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div>
            <button
              onClick={handleSubmit}
              className="bg-[#00a381] hover:bg-[#008f70] text-white px-8 py-2 rounded"
            >
              Save
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddCancellationReasonForm;

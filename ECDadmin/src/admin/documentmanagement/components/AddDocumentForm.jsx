import React, { useState } from "react";
import {
  TextField, MenuItem,
  RadioGroup, FormControlLabel, Radio,
   Select
} from "@mui/material";
import { useDocumentTypes } from "../../api/document.js";

const AddDocumentForm = () => {
  const { addDocumentType } = useDocumentTypes();

  const [formData, setFormData] = useState({
    documentFor: "",
    documentName: "",
    status: "",
    expiryNeeded: "no",
  });

  const handleSubmit = async () => {
    if (!formData.documentName || !formData.documentFor || !formData.status) {
      alert("All fields are required");
      return;
    }

    const payload = {
      name: formData.documentName,
      type: formData.documentFor,
      status: formData.status,
      hasExpiry: formData.expiryNeeded === "yes",
    };

    try {
      await addDocumentType(payload);
      setFormData({
        documentFor: "",
        documentName: "",
        status: "",
        expiryNeeded: "no",
      });
    } catch {
      alert("Failed to save document");
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">


        {/* Form */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <label className="text-sm text-gray-600">Document For</label>
            <Select
              size="small"
              fullWidth
              value={formData.documentFor}
              onChange={(e) =>
                setFormData({ ...formData, documentFor: e.target.value })
              }
            >
              <MenuItem value="Restaurant">Restaurant</MenuItem>
              <MenuItem value="Driver">Driver</MenuItem>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Document Name</label>
            <TextField
              size="small"
              fullWidth
              value={formData.documentName}
              onChange={(e) =>
                setFormData({ ...formData, documentName: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Status</label>
            <Select
              size="small"
              fullWidth
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Expiry Date Needed</label>
            <RadioGroup
              row
              value={formData.expiryNeeded}
              onChange={(e) =>
                setFormData({ ...formData, expiryNeeded: e.target.value })
              }
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </div>

          <div className="col-span-full">
            <button
              onClick={handleSubmit}
              className="bg-[#00a67d] text-white px-8 py-2 rounded hover:bg-[#008f6c]"
            >
              Save
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AddDocumentForm;

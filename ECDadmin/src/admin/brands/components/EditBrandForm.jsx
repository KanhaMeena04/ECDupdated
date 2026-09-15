import React, { useEffect, useState } from "react";
import { TextField, Button, MenuItem } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useBrandById, useUpdateBrand } from "../../api/brands";

const EditBrandForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { brand, loading } = useBrandById(id);
  const { updateBrand, loading: updating } = useUpdateBrand(id);

  const [formData, setFormData] = useState({
    name: "",
    status: "inactive",
  });

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || "",
        status: brand.status || "inactive",
      });
    }
  }, [brand]);

  const handleChange = (key, value) => {
    setFormData((p) => ({ ...p, [key]: value }));
  };

  const handleSubmit = async () => {
    await updateBrand(formData);
    navigate("/brands");
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      <TextField
        fullWidth
        label="Brand Name"
        value={formData.name}
        onChange={(e) => handleChange("name", e.target.value)}
      />

      <TextField
        select
        fullWidth
        label="Status"
        value={formData.status}
        onChange={(e) => handleChange("status", e.target.value)}
      >
        <MenuItem value="active">Active</MenuItem>
        <MenuItem value="inactive">Inactive</MenuItem>
      </TextField>

      <Button
        variant="contained"
        className="bg-slate-900 hover:bg-black"
        onClick={handleSubmit}
        disabled={updating}
      >
        Update Brand
      </Button>
    </div>
  );
};

export default EditBrandForm;

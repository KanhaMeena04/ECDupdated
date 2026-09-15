import React, { useEffect, useState } from "react";
import { TextField, Button, Select, MenuItem } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useFilterCategories } from "../../api/filtter";

export default function EditFilterCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { getCategoryById, updateCategory } = useFilterCategories({
    autoFetch: false,
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const data = await getCategoryById(id);
        setForm({
          name: data.name || "",
          description: data.description || "",
          isActive: data.isActive ?? true,
        });
      } catch (err) {
        console.error("Failed to load category", err);
      }
    };

    if (id) fetchCategory();
  }, [id, getCategoryById]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateCategory(id, form);
      navigate("/filter-category");
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded border space-y-4 max-w-xl">

        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          fullWidth
        />

        <TextField
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          fullWidth
        />

        <Select
          name="isActive"
          value={form.isActive}
          onChange={handleChange}
          fullWidth
        >
          <MenuItem value={true}>Active</MenuItem>
          <MenuItem value={false}>Inactive</MenuItem>
        </Select>

        <Button
          variant="contained"
          sx={{ backgroundColor: "#00a689" }}
          onClick={handleSubmit}
          disabled={loading}
        >
          Update
        </Button>
      </div>
    </div>
  );
}

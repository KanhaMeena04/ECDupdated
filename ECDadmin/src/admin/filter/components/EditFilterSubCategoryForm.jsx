import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Select,
  MenuItem,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useFilterCategories } from "../../api/filtter";

export default function EditFilterSubCategoryForm() {
  const navigate = useNavigate();
  const { categoryId, subCategoryId } = useParams();

  const {
    getCategoryById,
    updateCategory,
  } = useFilterCategories({ autoFetch: false });

  const [form, setForm] = useState({
    name: "",
    isActive: true,
  });

  const [parentSubcategories, setParentSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId || !subCategoryId) {
      console.error("Missing route params");
      return;
    }

    const fetchData = async () => {
      try {
        const category = await getCategoryById(categoryId);

        if (!category?.subcategories?.length) {
          throw new Error("No subcategories found");
        }

        const sub = category.subcategories.find(
          (s) => s._id === subCategoryId
        );

        if (!sub) {
          throw new Error("Subcategory not found");
        }

        setForm({
          name: sub.name || "",
          isActive: sub.isActive ?? true,
        });

        setParentSubcategories(category.subcategories);
      } catch (err) {
        console.error("Failed to load subcategory", err);
      }
    };

    fetchData();
  }, [categoryId, subCategoryId, getCategoryById]);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const updatedSubcategories = parentSubcategories.map((sub) =>
        sub._id === subCategoryId
          ? { ...sub, ...form }
          : sub
      );

      await updateCategory(categoryId, {
        subcategories: updatedSubcategories,
      });

      navigate("/filter-sub-category");
    } catch (err) {
      console.error("Failed to update subcategory", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI (UNCHANGED) ================= */
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded border space-y-4 max-w-xl">

        <TextField
          label="Subcategory Name"
          name="name"
          value={form.name}
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
          Update Subcategory
        </Button>
      </div>
    </div>
  );
}

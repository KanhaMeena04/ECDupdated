import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { useFilterCategories } from "../../api/filtter";

const AddFilterSubCategoryForm = () => {
  const {
    categories,
    fetchCategories,
    addSubcategory,
    loading,
  } = useFilterCategories({ autoFetch: true });

  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.categoryId || !form.name.trim()) {
      setError("Category and subcategory name are required");
      return;
    }

    setSubmitting(true);
    try {
      await addSubcategory(form.categoryId, {
        name: form.name,
        isActive: form.isActive,
      });
      setForm({ categoryId: "", name: "", isActive: true });
    } catch (err) {
      setError(err.message || "Failed to add subcategory");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm max-w-xl">
      <h2 className="text-xl font-semibold mb-4">Add Subcategory</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          select
          label="Select Category"
          value={form.categoryId}
          onChange={(e) =>
            setForm((p) => ({ ...p, categoryId: e.target.value }))
          }
          fullWidth
          disabled={loading}
        >
          {categories.map((cat) => (
            <MenuItem key={cat._id} value={cat._id}>
              {cat.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Subcategory Name"
          value={form.name}
          onChange={(e) =>
            setForm((p) => ({ ...p, name: e.target.value }))
          }
          fullWidth
          required
        />

        <FormControlLabel
          control={
            <Switch
              checked={form.isActive}
              onChange={(e) =>
                setForm((p) => ({ ...p, isActive: e.target.checked }))
              }
            />
          }
          label="Active"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          className="!bg-black"
        >
          {submitting ? (
            <CircularProgress size={22} />
          ) : (
            "Add Subcategory"
          )}
        </Button>
      </form>
    </div>
  );
};

export default AddFilterSubCategoryForm;

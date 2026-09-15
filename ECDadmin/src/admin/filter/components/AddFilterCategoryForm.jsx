import React, { useState } from "react";
import {
  TextField,
  Switch,
  Button,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { useFilterCategories } from "../../api/filtter";

const AddFilterCategoryForm = ({ onSuccess }) => {
  const { addCategory } = useFilterCategories({ autoFetch: false });

  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Category name is required");
      return;
    }

    setLoading(true);
    try {
      await addCategory(form);
      setForm({ name: "", description: "", isActive: true });
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm max-w-xl">
      <h2 className="text-xl font-semibold mb-4">Add Filter Category</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Category Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          fullWidth
          required
        />

        <TextField
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
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
          disabled={loading}
          className="!bg-black"
        >
          {loading ? <CircularProgress size={22} /> : "Create Category"}
        </Button>
      </form>
    </div>
  );
};

export default AddFilterCategoryForm;

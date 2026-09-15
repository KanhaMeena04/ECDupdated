import React, { useState, useEffect } from "react";
import {
  Tabs, Tab, Box, TextField, MenuItem, Button
} from "@mui/material";
import { PhotoSizeSelectActual, Language } from "@mui/icons-material";
import { useMasterCategory } from "../../api/category.js";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const EditCategoryForm = () => {
  const { updateCategory, categories } = useMasterCategory();
  const { id } = useParams();
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    name: "",
    status: "active",
    image: "",
  });

  // ðŸ”¹ Load category details by ID
  useEffect(() => {
    const category = categories.find((c) => c._id === id);
    if (category) {
      setForm({
        name: category.name || "",
        status: category.status || "active",
        image: category.image || "",
      });
      if (category.image) setImagePreview(category.image);
    }
  }, [categories, id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setForm({ ...form, image: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.status) {
      toast.error("Name and status are required");
      return;
    }

    await updateCategory(id, form);
    toast.success("Category updated successfully");
    navigate("/categories"); // go back to list after update
  };

  return (
    <div className="p-8 bg-white shadow-sm rounded-md min-h-screen">
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<Language />} label="English" />
          <Tab icon={<Language />} label="Arabic" />
        </Tabs>
      </Box>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
          <TextField
            size="small"
            label="Category Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <TextField
            select
            size="small"
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </div>

        <div>
          <div className="w-24 h-24 border rounded flex items-center justify-center">
            {imagePreview ? (
              <img src={imagePreview} className="w-full h-full object-cover" />
            ) : (
              <PhotoSizeSelectActual />
            )}
          </div>

          <input hidden id="img" type="file" onChange={handleImageChange} />
          <label htmlFor="img">
            <Button component="span" variant="contained" 
            sx={{backgroundColor: '#248C70',}}
            >
              Choose File
            </Button>
          </label>
        </div>

        <Button type="submit" variant="contained"
         sx={{backgroundColor: '#248C70',}}

        >
          Update
        </Button>
      </form>
    </div>
  );
};

export default EditCategoryForm;

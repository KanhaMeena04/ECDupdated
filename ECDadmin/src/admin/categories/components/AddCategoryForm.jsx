import React, { useState } from "react";
import { TextField, MenuItem, Button } from "@mui/material";
import { PhotoSizeSelectActual } from "@mui/icons-material";
import { useMasterCategory } from "../../api/category.js";

const AddCategoryForm = () => {
  const { addCategory } = useMasterCategory();

  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    name: "",
    status: "",
    image: "", // will hold Base64 string
  });

  // Convert image file to Base64 string
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);      // preview image
      setForm(prev => ({ ...prev, image: reader.result })); // save Base64 string
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.status || !form.image) {
      alert("Name, status, and image are required");
      return;
    }

    await addCategory({
      name: form.name,
      status: form.status,
      image: form.image, // send Base64 string to backend
    });

    alert("Category added successfully");
    setForm({ name: "", status: "", image: "" });
    setImagePreview(null);
  };

  return (
    <div className="p-8 bg-white shadow-sm rounded-md min-h-screen">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
          <TextField
            size="small"
            label="Category Name"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          />

          <TextField
            select
            size="small"
            label="Status"
            value={form.status}
            onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </div>

        <div className="flex flex-col gap-2">
          <div className="w-24 h-24 border rounded flex items-center justify-center">
            {imagePreview ? (
              <img src={imagePreview} className="w-full h-full object-cover" />
            ) : (
              <PhotoSizeSelectActual />
            )}
          </div>

          <input
            hidden
            id="img"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          <label htmlFor="img">
            <Button component="span" variant="contained" sx={{ backgroundColor: "#248C70" }}>
              Choose File
            </Button>
          </label>
        </div>

        <Button sx={{ backgroundColor: "#248C70" }} type="submit" variant="contained">
          Save
        </Button>
      </form>
    </div>
  );
};

export default AddCategoryForm;

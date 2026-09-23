import React, { useState } from "react";
import {
  Tabs, Tab, Box, TextField, MenuItem,
  Select, Button, Paper, Typography
} from "@mui/material";
import { Translate, Image as ImageIcon } from "@mui/icons-material";
import {useAddTag} from "../../api/tag.js";

const AddTagForm = () => {
  const [tabValue, setTabValue] = useState(0);
  const { addTag, loading } = useAddTag();

  const [formData, setFormData] = useState({
    type: "Product",
    tagName: "",
    tagDescription: "",
    status: "",
    tagColor: "#F20C0C",
    tagImage: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = () => {
    addTag({
      name: formData.tagName,
      type: formData.type,
      description: formData.tagDescription,
      image: formData.tagImage,
      color: formData.tagColor,
      status: formData.status,
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Paper className="p-6 rounded-lg shadow-sm max-w-6xl mx-auto">

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab icon={<Translate />} label="English" />
          </Tabs>
        </Box>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <Select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              size="small"
              fullWidth
            >
              <MenuItem value="Product">Product</MenuItem>
              <MenuItem value="Category">Category</MenuItem>
            </Select>

            <TextField
              name="tagDescription"
              placeholder="Tag Description"
              size="small"
              fullWidth
              onChange={handleInputChange}
            />

            <div>
              <ImageIcon />
              <input type="file" hidden />
            </div>
          </div>

          <div className="space-y-6">
            <TextField
              name="tagName"
              placeholder="Tag Name"
              size="small"
              fullWidth
              onChange={handleInputChange}
            />

            <Select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              size="small"
              fullWidth
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>

            <Typography>Tag Color</Typography>
            <TextField
              name="tagColor"
              size="small"
              fullWidth
              value={formData.tagColor}
              onChange={handleInputChange}
            />
          </div>

          <Button
            disabled={loading}
            onClick={handleSubmit}
            variant="contained"
            className="bg-[#248C70]"
          >
            Save
          </Button>
        </div>
      </Paper>
    </div>
  );
};

export default AddTagForm;

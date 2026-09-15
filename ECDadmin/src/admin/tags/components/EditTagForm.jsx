import React, { useEffect, useState } from "react";
import {
   TextField, MenuItem,
  Select, Button, Paper, Typography
} from "@mui/material";
import {  Image as ImageIcon } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { useTagDetails, useTags } from "../../api/tag.js";

const EditTagForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { tag } = useTagDetails(id);
  const { updateTag } = useTags();

  const [formData, setFormData] = useState({
    type: "",
    tagName: "",
    tagDescription: "",
    status: "",
    tagColor: "",
    tagImage: null,
  });

  useEffect(() => {
    if (!tag) return;

    setFormData({
      type: tag.type,
      tagName: tag.name,
      tagDescription: tag.description,
      status: tag.status,
      tagColor: tag.color,
      tagImage: null,
    });
  }, [tag]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async () => {
    await updateTag(id, {
      name: formData.tagName,
      type: formData.type,
      description: formData.tagDescription,
      color: formData.tagColor,
      status: formData.status,
      image: formData.tagImage,
    });

    navigate("/tags");
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Paper className="p-6 rounded-lg shadow-sm max-w-6xl mx-auto">
       
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
              value={formData.tagDescription}
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
              value={formData.tagName}
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
            onClick={handleSubmit}
            variant="contained"
            className="bg-[#248C70]"
          >
            Update
          </Button>
        </div>
      </Paper>
    </div>
  );
};

export default EditTagForm;

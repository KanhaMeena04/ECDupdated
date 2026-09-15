import React, { useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  Button,
} from "@mui/material";
import { Image as ImageIcon } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGroupTagDetails,
  useUpdateGroupTag,
} from "../../api/grouptag";
import LanguageSwitcher from "../../components/LanguageSwitcher";

export default function EditGroupTagForm() {
  const { id } = useParams(); // tag id from route
  const navigate = useNavigate();

  const { tag, loading } = useGroupTagDetails(id);
  const { updateTag, loading: updating } = useUpdateGroupTag();

  const [form, setForm] = useState({
    name: "",
    description: "",
    group: "",
    isActive: true,
    image: null,
    preview: "",
  });

  /* ===============================
     PREFILL FORM ON LOAD
  =============================== */
  useEffect(() => {
    if (!tag) return;

    setForm({
      name: tag.name || "",
      description: tag.description || "",
      group: tag.group?._id || "",
      isActive: tag.isActive ?? true,
      image: null,
      preview: tag.image || "",
    });
  }, [tag]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  /* ===============================
     SUBMIT UPDATE
  =============================== */
  const handleSubmit = async () => {
    const payload = {
      name: form.name,
      description: form.description,
      group: form.group,
      isActive: form.isActive,
      image: form.image || form.preview, // backend-compatible
    };

    await updateTag(id, payload);
    navigate("/admin/group-tags");
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-md border border-gray-200 p-8 max-w-7xl mx-auto">
        <LanguageSwitcher />

        <div className="space-y-6">
          {/* Name + Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500">Tag name</label>
              <TextField
                fullWidth
                size="small"
                name="name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Tag Description</label>
              <TextField
                fullWidth
                size="small"
                name="description"
                value={form.description}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Group + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormControl fullWidth size="small">
              <Select
                name="group"
                value={form.group}
                onChange={handleChange}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Select Group
                </MenuItem>
                {/* populate from groups API */}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <Select
                name="isActive"
                value={form.isActive}
                onChange={handleChange}
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </div>

          {/* Image */}
          <div className="space-y-3">
            <label className="text-sm text-gray-500">Tag image</label>

            <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
              {form.preview ? (
                <img
                  src={form.preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={40} className="text-gray-400" />
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="contained" component="label">
                Choose file
                <input hidden type="file" onChange={handleImageChange} />
              </Button>

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={updating}
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

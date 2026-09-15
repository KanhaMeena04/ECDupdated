import React, { useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { Image as ImageIcon } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

import {
  useCreateGroupTag,
  useUpdateGroupTag,
  useGroupTagDetails,
} from "../../api/grouptag";
import { useGroups } from "../../api/group";
import LanguageSwitcher from "../../components/LanguageSwitcher";

export default function GroupTagForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { tag, loading } = useGroupTagDetails(id);
  const { groups = [] } = useGroups();

  const { createTag } = useCreateGroupTag();
  const { updateTag } = useUpdateGroupTag();

  const [form, setForm] = useState({
    name: "",
    description: "",
    group: "",
    isActive: true,
    image: null,
    preview: "",
  });

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

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.group) {
      alert("Name and Group are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("group", form.group);
    formData.append("isActive", form.isActive);

    if (form.image instanceof File) {
      formData.append("image", form.image);
    }

    if (id) {
      await updateTag(id, formData);
    } else {
      await createTag(formData);
    }

    navigate("/group-tag-list");
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-8 max-w-6xl mx-auto space-y-6">
        <LanguageSwitcher />

        <div className="grid md:grid-cols-2 gap-6">
          <TextField
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Tag name"
            size="small"
            fullWidth
          />

          <TextField
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Tag description"
            size="small"
            fullWidth
          />
        </div>

        {/* GROUP SELECT */}
        <div>
          <label className="text-sm text-gray-500">Group</label>
          <Select
            fullWidth
            size="small"
            name="group"
            value={form.group}
            onChange={handleChange}
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select Group
            </MenuItem>

            {groups.map((g) => (
              <MenuItem key={g._id} value={g._id}>
                {g.name}
              </MenuItem>
            ))}
          </Select>
        </div>

        <div className="space-y-3">
          <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded">
            {form.preview ? (
              <img
                src={form.preview}
                alt="preview"
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <ImageIcon className="text-gray-400" />
            )}
          </div>

          <Button component="label" variant="contained">
            Choose Image
            <input hidden type="file" accept="image/*" onChange={handleImage} />
          </Button>
        </div>

        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{ width: 120 }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

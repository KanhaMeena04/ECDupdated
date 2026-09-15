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
import { useGroupDetails, useUpdateGroup } from "../../api/group";

export default function EditGroupForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { group, loading } = useGroupDetails(id);
  const { updateGroup, loading: updating } = useUpdateGroup();

  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
    image: "",
  });

  useEffect(() => {
    if (!group) return;
    setForm({
      name: group.name || "",
      description: group.description || "",
      isActive: group.isActive ?? true,
      image: group.image || "",
    });
  }, [group]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    await updateGroup(id, form);
    navigate("/group-list");
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-md border border-gray-200 p-8 max-w-5xl mx-auto space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-500">Group name</label>
            <TextField
              fullWidth
              size="small"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">Description</label>
            <TextField
              fullWidth
              size="small"
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </div>
        </div>

        <FormControl fullWidth size="small">
          <label className="text-sm text-gray-500 mb-1">Status</label>
          <Select
            name="isActive"
            value={form.isActive}
            onChange={handleChange}
          >
            <MenuItem value={true}>Active</MenuItem>
            <MenuItem value={false}>Inactive</MenuItem>
          </Select>
        </FormControl>

        {/* IMAGE (UI SAME, BACKEND OPTIONAL) */}
        <div className="space-y-3">
          <label className="text-sm text-gray-500">Group image</label>
          <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
            {form.image ? (
              <img
                src={form.image}
                alt="group"
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <ImageIcon size={40} className="text-gray-400" />
            )}
          </div>
        </div>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={updating}
          sx={{
            backgroundColor: "#248C70",
            "&:hover": { backgroundColor: "#1c6d57" },
            textTransform: "none",
            width: "120px",
          }}
        >
          Update
        </Button>
      </div>
    </div>
  );
}

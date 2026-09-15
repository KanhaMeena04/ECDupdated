import React, { useState } from "react";
import {
  DataGrid,
  gridClasses,
} from "@mui/x-data-grid";
import {
  Paper,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Box,
  Button,
} from "@mui/material";
import {
  Edit3,
  Image as ImageIcon,
  Languages,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useGroups } from "../../api/group";

export default function AddGroupForm() {
  const { groups, addGroup, updateGroup, loading } = useGroups();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    group: "",
    status: "active",
    image: null,
  });

  /* ---------- HANDLERS ---------- */
  const handleChange = (field) => (e) => {
    const value = field === "status" ? e.target.value : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, image: file }));
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("group", form.group);
    formData.append("isActive", form.status === "active");
    if (form.image) formData.append("image", form.image);

    if (editingId) {
      await updateGroup(editingId, formData);
    } else {
      await addGroup(formData);
    }

    setForm({ name: "", description: "", group: "", status: "active", image: null });
    setEditingId(null);
  };

  const handleEdit = (id) => {
    const g = groups.find((x) => x._id === id);
    if (!g) return;
    setEditingId(id);
    setForm({
      name: g.name,
      description: g.description || "",
      group: g.group || "",
      status: g.isActive ? "active" : "inactive",
      image: null,
    });
  };

  /* ---------- TABLE ---------- */
  const columns = [
    { field: "id", headerName: "", width: 60 },
    { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        const isActive = params.value === "Active";
        return (
          <button
            className={`px-4 py-1 rounded border text-xs font-medium transition-colors bg-white ${
              isActive
                ? "border-emerald-500 text-emerald-500"
                : "border-orange-400 text-orange-400"
            }`}
          >
            {params.value}
          </button>
        );
      },
    },
    {
      field: "action",
      headerName: "Action",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={() => handleEdit(params.row.id)}>
          <Edit3 size={18} />
        </IconButton>
      ),
    },
  ];

  const rows = groups.map((g) => ({
    id: g._id,
    name: g.name,
    status: g.isActive ? "Active" : "Inactive",
  }));

  /* ---------- RENDER ---------- */
  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-10">
      {/* FORM */}
      <Paper elevation={0} className="p-8 border rounded-sm shadow-sm bg-white">
      

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <div className="space-y-1.5">
            <label className="text-sm text-gray-500">Group name</label>
            <TextField fullWidth placeholder="Group name" size="small" variant="outlined" value={form.name} onChange={handleChange("name")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-gray-500">Group Description</label>
            <TextField fullWidth placeholder="Group Description" size="small" value={form.description} onChange={handleChange("description")} />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm text-gray-500">Status</label>
            <Select fullWidth size="small" value={form.status} onChange={handleChange("status")}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="text-sm text-gray-500 block">Group image</label>
          <div className="w-28 h-28 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
            {form.image ? (
              <img src={URL.createObjectURL(form.image)} alt="" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <ImageIcon size={48} strokeWidth={1} className="text-gray-300" />
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="contained" component="label" className="bg-[#248C70] hover:bg-[#1c6d57] normal-case w-fit px-6 shadow-none">
              Choose a file
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            <Button variant="contained" className="bg-[#248C70] hover:bg-[#1c6d57] normal-case w-28 shadow-none" onClick={handleSubmit}>
              {editingId ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </Paper>

    
    </div>
  );
}

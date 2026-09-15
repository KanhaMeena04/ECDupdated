import React, { useState } from "react";
import { DataGrid, gridClasses } from "@mui/x-data-grid";
import {
  Paper,
  IconButton,
} from "@mui/material";
import {
  Edit3,
  Image as ImageIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGroupTags, useDeleteGroupTag } from "../../api/grouptag";

export default function GroupTagDashboard() {
  const navigate = useNavigate();
  const [page] = useState(1);

  const { tags, total, loading, refetch } = useGroupTags({ page });
  const { deleteTag } = useDeleteGroupTag();

  const handleEdit = (id) => {
    navigate(`/edit-group-tag/${id}`);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Delete this group tag?");
    if (!confirm) return;
    await deleteTag(id);
    refetch();
  };

  const rows = tags.map((tag, index) => ({
    id: tag._id,
    index: index + 1,
    name: tag.name,
    group: tag.group?.name || "-",
    img: tag.image,
    status: tag.isActive ? "Active" : "Inactive",
  }));

  const columns = [
    { field: "index", headerName: "", width: 50, align: "center" },
    { field: "name", headerName: "Name", flex: 1.5 },
    { field: "group", headerName: "Group Name", flex: 1 },
    {
      field: "img",
      headerName: "Image",
      width: 120,
      renderCell: (params) =>
        params.value ? (
          <img
            src={params.value}
            alt=""
            className="w-12 h-12 rounded border object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <ImageIcon size={18} />
            <span className="text-[10px]">No image</span>
          </div>
        ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => (
        <button className="px-4 py-1 rounded border border-emerald-500 text-emerald-500 text-xs font-medium bg-white">
          {params.value}
        </button>
      ),
    },
    {
      field: "action",
      headerName: "Action",
      width: 120,
      renderCell: (params) => (
        <div className="flex gap-2">
          <IconButton size="small" onClick={() => handleEdit(params.row.id)}>
            <Edit3 size={18} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
            className="text-red-500"
          >
            <Trash2 size={18} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Paper elevation={0} className="border border-gray-200">
        <DataGrid
          rows={rows}
          columns={columns}
          rowHeight={70}
          loading={loading}
          disableRowSelectionOnClick
          hideFooter
          sx={{
            border: "none",
            [`& .${gridClasses.columnHeader}`]: {
              backgroundColor: "#fff",
              fontWeight: "bold",
            },
            [`& .${gridClasses.cell}`]: {
              borderBottom: "1px solid #f1f5f9",
            },
          }}
        />

        {/* Pagination (UI untouched) */}
        <div className="p-4 flex justify-between text-xs text-gray-400">
          <span>Showing {rows.length} of {total}</span>
          <div className="flex gap-1">
            <ChevronLeft size={16} />
            <span className="font-bold text-[#248C70]">1</span>
            <ChevronRight size={16} />
          </div>
        </div>
      </Paper>
    </div>
  );
}

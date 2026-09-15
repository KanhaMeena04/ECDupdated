import React, { useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Paper, IconButton } from '@mui/material';
import { Edit3, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAddons, useDeleteAddon } from '../api/addons.js';

const columns = (onEdit, onDelete) => [
  { field: 'id', headerName: '', width: 50, sortable: false },

  {
    field: 'restaurant',
    headerName: 'Restaurant',
    flex: 1,
    minWidth: 200,
  },

  {
    field: 'itemName',
    headerName: 'Item Name',
    flex: 1,
    minWidth: 200,
  },

  {
    field: 'price',
    headerName: 'Price',
    flex: 1,
    minWidth: 150,
    renderCell: (params) =>
      `RM ${(Number(params.value) || 0).toFixed(2)}`,
  },

  {
    field: 'action',
    headerName: 'Action',
    width: 120,
    sortable: false,
    renderCell: (params) => (
      <div className="flex gap-2">
        <IconButton
          size="small"
          className="text-gray-600 hover:text-blue-600"
          onClick={() => onEdit(params.row._id)}
        >
          <Edit3 size={18} />
        </IconButton>

        <IconButton
          size="small"
          className="text-gray-600 hover:text-red-600"
          onClick={() => onDelete(params.row._id)}
        >
          <Trash2 size={18} />
        </IconButton>
      </div>
    ),
  },
];

export default function RestaurantTable() {
  const navigate = useNavigate();

  const { addons = [], loading, refetch } = useAddons();
  const { deleteAddon, loading: deleting } = useDeleteAddon();

  const [deleteId, setDeleteId] = useState(null);

  // 🔥 Normalize backend garbage safely
  const rows = useMemo(() => {
    return addons.map((addon, index) => {
      const restaurantName =
        typeof addon.restaurant?.name === 'string'
          ? addon.restaurant.name
          : addon.restaurant?.name?.en || '—';

      return {
        id: index + 1,
        _id: addon._id,
        restaurant: restaurantName,
        itemName: addon.name || '—',
        price: addon.price ?? 0,
      };
    });
  }, [addons]);

  /** ---------- ACTION HANDLERS ---------- */

  const handleEdit = (id) => {
    navigate(`/edit-addon/${id}`);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    await deleteAddon(deleteId);
    setDeleteId(null);
    refetch(); // refresh list
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Paper className="w-full shadow-sm border border-gray-200 overflow-hidden">
        <DataGrid
          rows={rows}
          columns={columns(handleEdit, handleDeleteClick)}
          loading={loading || deleting}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8fafc',
              color: '#475569',
              fontWeight: 'bold',
              borderBottom: '1px solid #e2e8f0',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f1f5f9',
              color: '#334155',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #e2e8f0',
            },
          }}
        />
      </Paper>

      <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
        <p>Showing 1 to {rows.length} entries</p>
      </div>

      {/* 🔴 Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-[360px]">
            <h3 className="text-lg font-semibold text-gray-800">
              Delete Addon
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete this addon? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-sm border rounded-md"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

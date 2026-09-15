import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Pagination, IconButton 
} from '@mui/material';
import { Edit, Trash2 } from 'lucide-react';
import { useBrandList, useDeleteBrand } from '../../api/brands.js';
import { useNavigate } from 'react-router-dom';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';

function BrandTable() {
  const { brands, loading, error, refetch } = useBrandList();
  const { deleteBrand, loading: deleting } = useDeleteBrand();
  const navigate = useNavigate();

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleEdit = (id) => {
    navigate(`/edit-brand/${id}`);
  };

  const handleDeleteClick = (brand) => {
    setSelectedBrand(brand);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBrand) return;
    await deleteBrand(selectedBrand._id);
    setDeleteDialogOpen(false);
    setSelectedBrand(null);
    refetch(); // refresh list
  };

  return (
    <Paper elevation={0} className="border border-gray-200">
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell width="50" className="font-bold border-r"></TableCell>
              <TableCell className="font-bold text-gray-700">Name</TableCell>
              <TableCell className="font-bold text-gray-700">Status</TableCell>
              <TableCell className="font-bold text-gray-700">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  Loading brands...
                </TableCell>
              </TableRow>
            )}

            {!loading && error && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && brands.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-400">
                  No brands found
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && brands.map((row, index) => (
              <TableRow key={row._id} hover className="border-b">
                <TableCell className="border-r text-gray-500">{index + 1}</TableCell>
                <TableCell className="text-gray-600">{row.name}</TableCell>
                <TableCell>
                  <span className={`border px-3 py-1 rounded text-xs font-medium ${
                    row.status === "active" ? "border-green-500 text-green-500" : "border-gray-400 text-gray-400"
                  }`}>
                    {row.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <IconButton size="small" className="text-gray-500" onClick={() => handleEdit(row._id)}>
                      <Edit size={16} />
                    </IconButton>
                    <IconButton size="small" className="text-red-500" onClick={() => handleDeleteClick(row)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <div className="flex justify-between items-center p-4 bg-white border-t">
        <div className="text-sm text-gray-500">
          Showing 1 to {brands.length} of {brands.length} entries
        </div>
        <Pagination 
          count={1} 
          shape="rounded" 
          size="small"
          sx={{
            '& .Mui-selected': {
              backgroundColor: '#00a67e !important',
              color: 'white',
            }
          }}
        />
      </div>

      {/* Confirm Delete Dialog */}
      {deleteDialogOpen && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          title={`Delete Brand "${selectedBrand?.name}"?`}
          description="This action cannot be undone."
          loading={deleting}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </Paper>
  );
}

export default BrandTable;

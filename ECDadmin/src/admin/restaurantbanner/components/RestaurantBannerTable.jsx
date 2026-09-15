import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { Edit, DeleteOutline } from '@mui/icons-material';
import { useRestaurantBanner } from '../../api/restaurantbanner.js';
import { useNavigate } from 'react-router-dom';

const RestaurantBannerTable = () => {
  const navigate = useNavigate();
  const { banners, loading, error, deleteBanner } = useRestaurantBanner();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading banners...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  // ✅ CRITICAL FIX — NORMALIZE DATA
  const bannerList = Array.isArray(banners)
    ? banners
    : Array.isArray(banners?.banners)
    ? banners.banners
    : [];

  if (bannerList.length === 0) {
    return <div className="p-6 text-gray-500">No banners found.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <TableContainer component={Paper} className="shadow-md rounded-lg overflow-hidden">
        <Table sx={{ minWidth: 650 }}>
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Banner Title</TableCell>
              <TableCell>Picture</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {bannerList.map((row, index) => (
              <TableRow key={row._id}>
                <TableCell>{index + 1}</TableCell>

                <TableCell className="font-medium">
                  {row.title}
                </TableCell>

                <TableCell>
                  {row.image ? (
                    <img
                      src={row.image}
                      alt={row.title}
                      className="w-16 h-10 object-cover rounded border"
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No Image
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Chip
                    label={row.isActive ? 'Active' : 'Inactive'}
                    variant="outlined"
                    className={
                      row.isActive
                        ? 'border-green-500 text-green-600'
                        : 'border-orange-400 text-orange-500'
                    }
                  />
                </TableCell>

                <TableCell>
                  <div className="flex space-x-2">
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(`/edit-restaurant-banner/${row._id}`, {
                          state: row,
                        })
                      }
                    >
                      <Edit fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedId(row._id);
                        setConfirmOpen(true);
                      }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DELETE CONFIRMATION */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this banner?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            color="error"
            onClick={async () => {
              if (!selectedId) return;
              try {
                await deleteBanner(selectedId);
              } finally {
                setConfirmOpen(false);
                setSelectedId(null);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RestaurantBannerTable;

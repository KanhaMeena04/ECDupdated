import React, { useState } from 'react';
import {
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CheckCircle,
  Store,
  Email,
  Phone,
  VisibilityOutlined,
} from '@mui/icons-material';

import RestaurantTable from '../components/RestaurantTable';
import { usePendingRestaurants } from '../../api/restaurant';
import { useNavigate } from 'react-router-dom';

const PendingRestaurantTable = () => {
  const navigate = useNavigate();
  const {
    restaurants,
    loading,
    actionLoading,
    error,
    verifyRestaurant,
    rejectRestaurant,
  } = usePendingRestaurants();

  // State for rejection modal
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Open modal
  const handleRejectClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setRejectReason('');
    setOpenRejectModal(true);
  };

  // Confirm rejection
  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return; // Prevent empty reason
    rejectRestaurant(selectedRestaurant._id || selectedRestaurant.id, rejectReason);
    setOpenRejectModal(false);
  };

  const columns = [
    { key: 'index', label: '' },

    {
      key: 'restaurant',
      label: 'Restaurant Details',
      render: (rest) => (
        <>
          <Typography className="font-semibold text-blue-700">
            {rest.name?.en || rest.name}
          </Typography>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Email sx={{ fontSize: 14, mr: 0.5 }} />
            {rest.email}
          </div>
        </>
      ),
    },

    {
      key: 'owner',
      label: 'Owner Information',
      render: (rest) => (
        <>
          <Typography variant="body2">{rest.owner?.name}</Typography>
          <div className="flex items-center text-xs text-gray-500">
            <Phone sx={{ fontSize: 14, mr: 0.5 }} />
            {rest.owner?.mobile}
          </div>
        </>
      ),
    },

    {
      key: 'location',
      label: 'Location',
      render: (rest) => (
        <>
          <Typography variant="body2">{rest.city}</Typography>
          <Typography variant="caption" className="text-gray-400">
            {rest.area}
          </Typography>
        </>
      ),
    },

    {
      key: 'status',
      label: 'Approved',
      render: (rest) =>
        rest.restaurantApproved ? (
          <Chip label="Approved" color="success" size="small" />
        ) : rest.restaurantRejected ? (
          <Chip label="Rejected" color="error" size="small" />
        ) : (
          <Chip label="Pending" color="warning" size="small" />
        ),
    },

    {
      key: 'actions',
      label: 'Actions',
      render: (rest) => {
        const restaurantId = rest._id || rest.id;
        const isApproved = rest.restaurantApproved;
        const isRejected = rest.restaurantRejected;

        const isBusy = actionLoading === restaurantId;

        return (
          <div className="flex justify-center gap-2">
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={() => navigate(`/restaurant/${restaurantId}`)}
              >
                <VisibilityOutlined fontSize="small" className="hover:text-blue-500" />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={isBusy ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
              onClick={() => verifyRestaurant(restaurantId)}
              disabled={isApproved || isRejected || actionLoading !== null}
              className="bg-green-600 hover:bg-green-700 capitalize"
            >
              {isApproved ? 'Approved' : 'Approve'}
            </Button>

            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => handleRejectClick(rest)}
              disabled={isApproved || isRejected || actionLoading !== null}
              className="bg-red-600 hover:bg-red-700 capitalize"
            >
              {isRejected ? 'Rejected' : 'Reject'}
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <CircularProgress />
        <Typography className="mt-4 text-gray-500">Loading applications...</Typography>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Typography variant="h4" className="font-bold text-gray-800">
              Pending Approvals
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Review and verify new restaurant partnership applications.
            </Typography>
          </div>
          <Chip label={`${restaurants.length} Pending`} color="warning" variant="outlined" />
        </div>

        {error && <Alert severity="error">{error}</Alert>}

        {restaurants.length === 0 ? (
          <Paper className="p-10 text-center">
            <Store sx={{ fontSize: 60, color: '#cbd5e1' }} />
            <Typography variant="h6" className="text-gray-400 mt-2">
              No pending applications found.
            </Typography>
          </Paper>
        ) : (
          <RestaurantTable columns={columns} rows={restaurants} />
        )}
      </div>

      {/* Reject Modal */}
      <Dialog open={openRejectModal} onClose={() => setOpenRejectModal(false)}>
        <DialogTitle>Reason for Rejection</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Enter reason"
            type="text"
            fullWidth
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectModal(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={handleConfirmReject}
            disabled={!rejectReason.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PendingRestaurantTable;

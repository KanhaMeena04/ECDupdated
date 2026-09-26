import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

interface CategoryRequestItem {
  _id: string;
  name: string;
  type: string;
  parentCategoryId?: { _id: string; name: string };
  description?: string;
  reason?: string;
  restaurant?: { _id: string; name?: string | { en?: string } };
  requestedBy?: { name?: string; email?: string };
  status: string;
  createdAt: string;
}

export default function CategoryRequests() {
  const [requests, setRequests] = useState<CategoryRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReq, setSelectedReq] = useState<CategoryRequestItem | null>(null);
  const [rejectOpen, setRejectOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/category-requests`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch category requests');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error fetching category requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/category-requests/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Category request approved & added to Central Category Master!');
        fetchRequests();
      } else {
        toast.error(data.message || 'Failed to approve request');
      }
    } catch (err) {
      toast.error('Error approving request');
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedReq || !rejectionReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/category-requests/${selectedReq._id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Category request rejected');
        setRejectOpen(false);
        setRejectionReason('');
        fetchRequests();
      } else {
        toast.error(data.message || 'Failed to reject request');
      }
    } catch (err) {
      toast.error('Error rejecting request');
    }
  };

  const getRestaurantName = (req: CategoryRequestItem) => {
    if (!req.restaurant) return 'N/A';
    if (typeof req.restaurant.name === 'string') return req.restaurant.name;
    return req.restaurant.name?.en || 'Unnamed Restaurant';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, color: '#1E293B' }}>
        Restaurant Category Requests
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: '#64748B' }}>
        Approve or reject requests submitted by restaurants for new categories or subcategories.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : requests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#F8FAFC' }}>
          <Typography variant="h6" color="textSecondary">
            No category requests found.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F1F5F9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Restaurant</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Requested Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Parent Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason / Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{getRestaurantName(req)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{req.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={req.type === 'subcategory' ? 'Subcategory' : 'Main Category'}
                      size="small"
                      color={req.type === 'subcategory' ? 'secondary' : 'primary'}
                    />
                  </TableCell>
                  <TableCell>{req.parentCategoryId?.name || '-'}</TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography variant="body2" noWrap title={req.reason || req.description || ''}>
                      {req.reason || req.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={req.status.toUpperCase()}
                      size="small"
                      color={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'error' : 'warning'}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    {req.status === 'pending' ? (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleApprove(req._id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => {
                            setSelectedReq(req);
                            setRejectOpen(true);
                          }}
                        >
                          Reject
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        Completed
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Category Request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Category already exists or violates guidelines"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectSubmit}>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

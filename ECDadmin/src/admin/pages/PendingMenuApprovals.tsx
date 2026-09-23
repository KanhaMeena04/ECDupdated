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
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import toast from 'react-hot-toast';

interface PendingItem {
  _id: string;
  name: string;
  description: string;
  image?: string;
  restaurant?: {
    _id: string;
    name?: string | { en?: string };
    email?: string;
    contactNumber?: string;
  };
  category?: { _id: string; name?: string | { en?: string } };
  subcategory?: { _id: string; name?: string | { en?: string } };
  pricing: {
    b2c: { mrp: number; sellingPrice: number; discountPercent?: number };
    b2b: { sellingPrice: number; discountPercent?: number };
  };
  foodType: string;
  preparationTime: number;
  available: boolean;
  approvalStatus: string;
  submittedAt?: string;
  variations?: Array<{ name?: { en?: string } | string; price: number }>;
  addOns?: Array<{ name?: { en?: string } | string; price: number }>;
}

export default function PendingMenuApprovals() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [rejectOpen, setRejectOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [changeOpen, setChangeOpen] = useState<boolean>(false);
  const [changeRequest, setChangeRequest] = useState<string>('');

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/menu/pending', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch pending menu items');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Network error fetching pending items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/menu/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ notes: 'Approved via Admin Panel' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Menu item approved and published!');
        setDetailOpen(false);
        fetchPendingItems();
      } else {
        toast.error(data.message || 'Failed to approve item');
      }
    } catch (err) {
      toast.error('Error approving menu item');
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedItem || !rejectionReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    try {
      const res = await fetch(`/api/admin/menu/${selectedItem._id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Menu item rejected');
        setRejectOpen(false);
        setDetailOpen(false);
        setRejectionReason('');
        fetchPendingItems();
      } else {
        toast.error(data.message || 'Failed to reject item');
      }
    } catch (err) {
      toast.error('Error rejecting menu item');
    }
  };

  const handleChangeRequestSubmit = async () => {
    if (!selectedItem || !changeRequest.trim()) {
      toast.error('Please specify the requested changes');
      return;
    }
    try {
      const res = await fetch(`/api/admin/menu/${selectedItem._id}/request-changes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ changeRequest }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Change request sent to restaurant');
        setChangeOpen(false);
        setDetailOpen(false);
        setChangeRequest('');
        fetchPendingItems();
      } else {
        toast.error(data.message || 'Failed to send change request');
      }
    } catch (err) {
      toast.error('Error requesting changes');
    }
  };

  const getRestaurantName = (item: PendingItem) => {
    if (!item.restaurant) return 'N/A';
    if (typeof item.restaurant.name === 'string') return item.restaurant.name;
    return item.restaurant.name?.en || 'Unnamed Restaurant';
  };

  const getCategoryName = (cat: any) => {
    if (!cat) return '-';
    if (typeof cat.name === 'string') return cat.name;
    return cat.name?.en || '-';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, color: '#1E293B' }}>
        Pending Menu Approvals
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: '#64748B' }}>
        Review and approve or reject restaurant menu item submissions.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#F8FAFC' }}>
          <Typography variant="h6" color="textSecondary">
            No pending menu item approvals.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F1F5F9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Restaurant</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subcategory</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>B2C Price</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>B2B Price</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{getRestaurantName(item)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {item.image && (
                        <Box
                          component="img"
                          src={item.image}
                          alt={item.name}
                          sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
                        />
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.name}
                        </Typography>
                        <Chip
                          label={item.foodType}
                          size="small"
                          color={item.foodType === 'veg' ? 'success' : 'error'}
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{getCategoryName(item.category)}</TableCell>
                  <TableCell>{getCategoryName(item.subcategory)}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>
                    ₹{item.pricing?.b2c?.sellingPrice ?? 0}
                    {item.pricing?.b2c?.mrp && item.pricing.b2c.mrp > item.pricing.b2c.sellingPrice && (
                      <Typography component="span" variant="caption" sx={{ textDecoration: 'line-through', ml: 0.5, color: '#94A3B8' }}>
                        ₹{item.pricing.b2c.mrp}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>
                    ₹{item.pricing?.b2b?.sellingPrice ?? item.pricing?.b2c?.sellingPrice ?? 0}
                  </TableCell>
                  <TableCell>
                    <Chip label="Pending Review" size="small" color="warning" />
                  </TableCell>
                  <TableCell variant="body2" sx={{ fontSize: '0.8rem', color: '#64748B' }}>
                    {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Recent'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {
                          setSelectedItem(item);
                          setDetailOpen(true);
                        }}
                      >
                        Review
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleApprove(item._id)}
                      >
                        Approve
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Item Detail Review Modal */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        {selectedItem && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700}>
                Review Menu Item - {selectedItem.name}
              </Typography>
              <IconButton onClick={() => setDetailOpen(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  {selectedItem.image ? (
                    <CardMedia
                      component="img"
                      image={selectedItem.image}
                      alt={selectedItem.name}
                      sx={{ borderRadius: 2, height: 200, objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ height: 200, bgcolor: '#E2E8F0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      No Image Available
                    </Box>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <Chip label={selectedItem.foodType.toUpperCase()} color={selectedItem.foodType === 'veg' ? 'success' : 'error'} sx={{ mr: 1 }} />
                    <Chip label={selectedItem.available ? 'Available' : 'Out of Stock'} color={selectedItem.available ? 'info' : 'default'} />
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Restaurant Details
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                    {getRestaurantName(selectedItem)}
                  </Typography>

                  <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                    Category & Subcategory
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {getCategoryName(selectedItem.category)} → {getCategoryName(selectedItem.subcategory)}
                  </Typography>

                  <Typography variant="subtitle2" color="textSecondary">
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedItem.description || 'No description provided.'}
                  </Typography>

                  <Grid container spacing={2} sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2, mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">B2C Pricing</Typography>
                      <Typography variant="h6" color="primary">₹{selectedItem.pricing?.b2c?.sellingPrice ?? 0}</Typography>
                      <Typography variant="caption">MRP: ₹{selectedItem.pricing?.b2c?.mrp ?? 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">B2B Price (Corporate)</Typography>
                      <Typography variant="h6" color="secondary">₹{selectedItem.pricing?.b2b?.sellingPrice ?? 0}</Typography>
                    </Grid>
                  </Grid>

                  {selectedItem.addOns && selectedItem.addOns.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary">Add-ons</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        {selectedItem.addOns.map((addon, idx) => (
                          <Chip key={idx} label={`${typeof addon.name === 'string' ? addon.name : addon.name?.en || ''} (+₹${addon.price})`} variant="outlined" size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setRejectionReason('');
                  setRejectOpen(true);
                }}
              >
                Reject Item
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<EditIcon />}
                onClick={() => {
                  setChangeRequest('');
                  setChangeOpen(true);
                }}
              >
                Request Changes
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleApprove(selectedItem._id)}
              >
                Approve & Publish
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Menu Item</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Specify why this menu item is being rejected. The restaurant will receive this reason.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Invalid category selected, image quality is low"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectSubmit}>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog open={changeOpen} onClose={() => setChangeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Changes from Restaurant</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Detail the modifications required before this item can be approved.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Requested Changes"
            value={changeRequest}
            onChange={(e) => setChangeRequest(e.target.value)}
            placeholder="e.g. Please update B2C MRP to match selling price format"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangeOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleChangeRequestSubmit}>
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

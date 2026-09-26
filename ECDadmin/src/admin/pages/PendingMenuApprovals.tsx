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
  CardMedia,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  InputAdornment,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

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
  rejectionReason?: string;
  changeRequest?: string;
  submittedAt?: string;
  variations?: Array<{ name?: { en?: string } | string; price: number }>;
  addOns?: Array<{ name?: { en?: string } | string; price: number; image?: string }>;
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
  const [statusTab, setStatusTab] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [counts, setCounts] = useState<{ pending: number; approved: number; rejected: number; changes_requested: number; all: number }>({
    pending: 0,
    approved: 0,
    rejected: 0,
    changes_requested: 0,
    all: 0,
  });

  const fetchItems = React.useCallback(async (status: string) => {
    setLoading(true);
    try {
      const endpoint = status === 'pending'
        ? `${API_BASE_URL}/api/admin/menu/pending`
        : `${API_BASE_URL}/api/admin/menu/all?status=${status}`;

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      const data = await res.json();
      let rawList: any[] = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (data.success && Array.isArray(data.data)) {
        rawList = data.data;
      } else if (Array.isArray(data.items)) {
        rawList = data.items;
      } else if (Array.isArray(data.products)) {
        rawList = data.products;
      }

      setItems(rawList);

      // Also fetch all items count to update badge numbers across tabs
      try {
        const allRes = await fetch(`${API_BASE_URL}/api/admin/menu/all?status=all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        });
        const allData = await allRes.json();
        const allList: any[] = Array.isArray(allData) ? allData : (allData.data || allData.items || []);
        if (allList.length > 0) {
          const pendingCount = allList.filter(i => (i.approvalStatus === 'pending' || (!i.isApproved && !i.isRejected))).length;
          const approvedCount = allList.filter(i => (i.approvalStatus === 'approved' || i.isApproved)).length;
          const rejectedCount = allList.filter(i => (i.approvalStatus === 'rejected' || i.isRejected)).length;
          const changesCount = allList.filter(i => i.approvalStatus === 'changes_requested').length;
          setCounts({
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            changes_requested: changesCount,
            all: allList.length,
          });
        }
      } catch (_) {}
    } catch (err: any) {
      console.error(err);
      toast.error('Network error fetching menu items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(statusTab);
  }, [statusTab, fetchItems]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/menu/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ notes: 'Approved via Admin Panel' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Menu item approved and published to User App!');
        setDetailOpen(false);
        fetchItems(statusTab);
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
      const res = await fetch(`${API_BASE_URL}/api/admin/menu/${selectedItem._id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Menu item rejected. Reason sent to restaurant.');
        setRejectOpen(false);
        setDetailOpen(false);
        setRejectionReason('');
        fetchItems(statusTab);
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
      const res = await fetch(`${API_BASE_URL}/api/admin/menu/${selectedItem._id}/request-changes`, {
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
        fetchItems(statusTab);
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

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (item.name || '').toLowerCase();
    const restName = getRestaurantName(item).toLowerCase();
    const catName = getCategoryName(item.category).toLowerCase();
    return name.includes(query) || restName.includes(query) || catName.includes(query);
  });

  const getStatusChip = (status: string, reason?: string) => {
    switch (status) {
      case 'approved':
        return <Chip label="Approved & Live" size="small" color="success" sx={{ fontWeight: 600 }} />;
      case 'rejected':
        return (
          <Tooltip title={reason ? `Reason: ${reason}` : 'Rejected by Admin'}>
            <Chip label="Rejected" size="small" color="error" sx={{ fontWeight: 600 }} />
          </Tooltip>
        );
      case 'changes_requested':
        return (
          <Tooltip title={reason ? `Note: ${reason}` : 'Changes Requested'}>
            <Chip label="Changes Requested" size="small" color="info" sx={{ fontWeight: 600 }} />
          </Tooltip>
        );
      case 'pending':
      default:
        return <Chip label="Pending Review" size="small" color="warning" sx={{ fontWeight: 600 }} />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B' }}>
              Menu Management & Approvals
            </Typography>
            <Chip
              label={`${items.length} Items`}
              size="small"
              color={statusTab === 'pending' && items.length > 0 ? 'warning' : 'default'}
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Review, verify, and approve restaurant menu submissions. Approved items immediately become live on the User App.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchItems(statusTab)}
          disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Refresh
        </Button>
      </Box>

      {/* Tabs & Search Bar */}
      <Paper sx={{ mb: 3, p: 1.5, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Tabs
            value={statusTab}
            onChange={(e, val) => setStatusTab(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' } }}
          >
            <Tab label={`Pending Approvals (${counts.pending})`} value="pending" icon={<HourglassEmptyIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label={`Approved Items (${counts.approved})`} value="approved" icon={<CheckCircleIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label={`Rejected Items (${counts.rejected})`} value="rejected" icon={<CancelIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label={`Changes Requested (${counts.changes_requested})`} value="changes_requested" icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label={`All Menu Items (${counts.all})`} value="all" />
          </Tabs>

          <TextField
            size="small"
            placeholder="Search dish, restaurant, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }
            }}
            sx={{ width: 280 }}
          />
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : filteredItems.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 2 }}>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
            No {statusTab !== 'all' ? statusTab.replace('_', ' ') : ''} menu items found.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            When restaurants submit menu items, they will appear here for review and verification.
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => fetchItems(statusTab)}
            sx={{ mt: 2, textTransform: 'none' }}
          >
            Check Again
          </Button>
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
                <TableCell sx={{ fontWeight: 600 }}>Prep Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {getRestaurantName(item)}
                    </Typography>
                    {item.restaurant?.contactNumber && (
                      <Typography variant="caption" color="textSecondary">
                        {item.restaurant.contactNumber}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {item.image && (
                        <Box
                          component="img"
                          src={item.image}
                          alt={item.name}
                          sx={{ width: 42, height: 42, borderRadius: 1.5, objectFit: 'cover' }}
                        />
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.3 }}>
                          <Chip
                            label={(item.foodType || 'veg').toUpperCase()}
                            size="small"
                            color={item.foodType === 'veg' ? 'success' : (item.foodType === 'egg' ? 'warning' : 'error')}
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                          {item.variations && item.variations.length > 0 && (
                            <Chip label={`${item.variations.length} Flavors`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                          {item.addOns && item.addOns.length > 0 && (
                            <Chip label={`${item.addOns.length} Add-ons`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                        </Box>
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
                    {getStatusChip(item.approvalStatus, item.rejectionReason || item.changeRequest)}
                  </TableCell>
                  <TableCell variant="body" sx={{ fontSize: '0.85rem', color: '#64748B' }}>
                    {item.preparationTime || 15} mins
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
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Review
                      </Button>
                      {item.approvalStatus !== 'approved' && (
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleApprove(item._id)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Approve
                        </Button>
                      )}
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
                <Grid size={{ xs: 12, md: 4 }}>
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
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={(selectedItem.foodType || 'veg').toUpperCase()} color={selectedItem.foodType === 'veg' ? 'success' : (selectedItem.foodType === 'egg' ? 'warning' : 'error')} />
                    <Chip label={selectedItem.available ? 'Available' : 'Out of Stock'} color={selectedItem.available ? 'info' : 'default'} />
                    {getStatusChip(selectedItem.approvalStatus, selectedItem.rejectionReason || selectedItem.changeRequest)}
                  </Box>

                  {selectedItem.rejectionReason && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#FEF2F2', borderRadius: 1.5, border: '1px solid #FCA5A5' }}>
                      <Typography variant="caption" color="error" fontWeight={700}>Rejection Reason:</Typography>
                      <Typography variant="body2" color="error">{selectedItem.rejectionReason}</Typography>
                    </Box>
                  )}

                  {selectedItem.changeRequest && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#EFF6FF', borderRadius: 1.5, border: '1px solid #93C5FD' }}>
                      <Typography variant="caption" color="primary" fontWeight={700}>Changes Requested:</Typography>
                      <Typography variant="body2" color="primary">{selectedItem.changeRequest}</Typography>
                    </Box>
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Restaurant Details
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                    {getRestaurantName(selectedItem)} {selectedItem.restaurant?.contactNumber ? `(${selectedItem.restaurant.contactNumber})` : ''}
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
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" color="textSecondary">B2C Selling Price</Typography>
                      <Typography variant="h6" color="primary">₹{selectedItem.pricing?.b2c?.sellingPrice ?? 0}</Typography>
                      <Typography variant="caption">MRP: ₹{selectedItem.pricing?.b2c?.mrp ?? 0}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" color="textSecondary">B2B Price (Corporate)</Typography>
                      <Typography variant="h6" color="secondary">₹{selectedItem.pricing?.b2b?.sellingPrice ?? 0}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" color="textSecondary">Prep Time</Typography>
                      <Typography variant="h6">{selectedItem.preparationTime || 15} mins</Typography>
                    </Grid>
                  </Grid>

                  {/* Flavor / Variations list */}
                  {selectedItem.variations && selectedItem.variations.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary">Flavor Variants ({selectedItem.variations.length})</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        {selectedItem.variations.map((variant, idx) => (
                          <Chip key={idx} label={typeof variant.name === 'string' ? variant.name : variant.name?.en || 'Flavor'} variant="outlined" size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Add-ons list */}
                  {selectedItem.addOns && selectedItem.addOns.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary">Add-ons ({selectedItem.addOns.length})</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        {selectedItem.addOns.map((addon, idx) => (
                          <Chip key={idx} label={`${typeof addon.name === 'string' ? addon.name : addon.name?.en || ''} (+₹${addon.price})`} variant="outlined" size="small" color="primary" />
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
                Approve & Publish to User App
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
            Specify why this menu item is being rejected. The restaurant will see this reason in their app.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Invalid category selected, image quality is low, inappropriate pricing"
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
            placeholder="e.g. Please update B2C MRP to match selling price format or upload high resolution image"
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

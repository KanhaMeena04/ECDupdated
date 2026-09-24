import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

export default function ServiceAreasPage() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    state: 'Madhya Pradesh',
    district: 'Indore',
    city: 'Indore',
    zone: 'Vijay Nagar',
    village: '',
    pincode: '452010',
    deliveryRadiusKm: 8,
    baseDeliveryFee: 30,
    minimumOrderValue: 100,
    peakCharge: 0
  });

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
  };

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const baseUrl = API_BASE_URL || 'http://localhost:5000';
      const res = await axios.get(`${baseUrl}/api/service-areas`, getAuthConfig());
      if (res.data && res.data.areas) {
        setAreas(res.data.areas);
      } else if (Array.isArray(res.data)) {
        setAreas(res.data);
      }
    } catch (err) {
      console.error('Failed to load service areas:', err);
      toast.error(err.response?.data?.message || 'Failed to load service areas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleToggle = async (id) => {
    try {
      const baseUrl = API_BASE_URL || 'http://localhost:5000';
      const res = await axios.patch(`${baseUrl}/api/service-areas/${id}/toggle`, {}, getAuthConfig());
      if (res.data.success) {
        toast.success(res.data.message || 'Service area status updated');
        fetchAreas();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle service area');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service area?')) return;
    try {
      const baseUrl = API_BASE_URL || 'http://localhost:5000';
      const res = await axios.delete(`${baseUrl}/api/service-areas/${id}`, getAuthConfig());
      if (res.data.success) {
        toast.success('Service area deleted successfully');
        fetchAreas();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete service area');
    }
  };

  const handleCreate = async () => {
    if (!formData.state || !formData.district || !formData.city || !formData.zone || !formData.pincode) {
      toast.error('Please fill all required fields (State, District, City, Zone, Pincode)');
      return;
    }
    try {
      const baseUrl = API_BASE_URL || 'http://localhost:5000';
      const res = await axios.post(`${baseUrl}/api/service-areas`, formData, getAuthConfig());
      if (res.data.success) {
        toast.success(res.data.message || 'Service area added successfully');
        setOpenModal(false);
        fetchAreas();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding service area');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
            Multi-Tier Service Areas (India-First Taxonomy)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage State &rarr; District &rarr; City &rarr; Zone &rarr; Village &rarr; Pincode service status & fees.
          </Typography>
        </div>
        <Button
          variant="contained"
          sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' }, textTransform: 'none', fontWeight: 600 }}
          onClick={() => setOpenModal(true)}
        >
          + Add Service Area
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Hierarchy Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Pincode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Radius (km)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Base Delivery Fee</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Min Order</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Service Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Toggle</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: '#6b7280' }}>
                    Loading service areas...
                  </TableCell>
                </TableRow>
              ) : areas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: '#6b7280' }}>
                    No service areas registered yet. Click "+ Add Service Area" to expand coverage.
                  </TableCell>
                </TableRow>
              ) : (
                areas.map((area) => (
                  <TableRow key={area._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {`${area.zone}, ${area.city}, ${area.district} (${area.state})`}
                      {area.village ? ` - Village: ${area.village}` : ''}
                    </TableCell>
                    <TableCell><Chip label={area.pincode} size="small" variant="outlined" color="primary" /></TableCell>
                    <TableCell>{`${area.deliveryRadiusKm} km`}</TableCell>
                    <TableCell>{`₹${area.baseDeliveryFee}`}</TableCell>
                    <TableCell>{`₹${area.minimumOrderValue}`}</TableCell>
                    <TableCell>
                      <Chip
                        label={area.isServiceActive ? 'ACTIVE' : 'INACTIVE'}
                        color={area.isServiceActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch checked={area.isServiceActive} onChange={() => handleToggle(area._id)} color="success" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Delete Service Area">
                        <IconButton size="small" color="error" onClick={() => handleDelete(area._id)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Service Area</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <TextField label="State" fullWidth value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="District" fullWidth value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="City" fullWidth value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Zone" fullWidth value={formData.zone} onChange={(e) => setFormData({ ...formData, zone: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Village (Optional)" fullWidth value={formData.village} onChange={(e) => setFormData({ ...formData, village: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Pincode" fullWidth value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Delivery Radius (km)" type="number" fullWidth value={formData.deliveryRadiusKm} onChange={(e) => setFormData({ ...formData, deliveryRadiusKm: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Base Delivery Fee (₹)" type="number" fullWidth value={formData.baseDeliveryFee} onChange={(e) => setFormData({ ...formData, baseDeliveryFee: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Min Order Value (₹)" type="number" fullWidth value={formData.minimumOrderValue} onChange={(e) => setFormData({ ...formData, minimumOrderValue: Number(e.target.value) })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' } }} onClick={handleCreate}>Add Area</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

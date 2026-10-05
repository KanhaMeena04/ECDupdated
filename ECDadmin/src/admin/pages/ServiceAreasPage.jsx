import React, { useState, useEffect, useRef } from 'react';
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
  Slider,
  CircularProgress,
  Tooltip,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  InputAdornment
} from '@mui/material';
import { Edit2, Trash2, MapPin, Navigation, Compass, Plus, RefreshCw, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';
import GoogleServiceAreaMap from '../components/GoogleServiceAreaMap';

export default function ServiceAreasPage() {
  const [areas, setAreas] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Search & Geocoding State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [formData, setFormData] = useState({
    state: 'Madhya Pradesh',
    district: 'Indore',
    city: 'Indore',
    zone: 'Vijay Nagar',
    village: '',
    pincode: '452010',
    deliveryRadiusKm: 25,
    baseDeliveryFee: 30,
    minimumOrderValue: 100,
    peakCharge: 0,
    lat: 22.7533,
    lng: 75.8937,
  });

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const fetchAreas = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/service-areas`);
      if (res.data.areas) setAreas(res.data.areas);
    } catch (err) {
      toast.error('Failed to load service areas');
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const mapCenter = [Number(formData.lat) || 22.7533, Number(formData.lng) || 75.8937];

  // Update Map Center smoothly when lat/lng changes
  useEffect(() => {
    if (mapRef.current) {
      try {
        mapRef.current.flyTo(mapCenter, 13, { duration: 1.2 });
      } catch (err) {
        console.log('Map view update:', err);
      }
    }
  }, [formData.lat, formData.lng]);

  // Attach Map Click Listener cleanly when modal is open
  useEffect(() => {
    if (!openModal) return;
    const timer = setTimeout(() => {
      if (mapRef.current) {
        const map = mapRef.current;
        map.off('click');
        map.on('click', (e) => {
          if (e && e.latlng) {
            handleReverseGeocode(e.latlng.lat, e.latlng.lng);
          }
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [openModal]);

  // Handle Search Location submit
  const handleLocationSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery || !searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/service-areas/search-location`, {
        params: { query: searchQuery.trim() },
      });
      if (res.data.results && res.data.results.length > 0) {
        setSearchResults(res.data.results);
      } else {
        setSearchResults([]);
        toast.error('No matching locations found');
      }
    } catch (err) {
      console.error('Location search error:', err);
      toast.error('Error searching location');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting a location search result
  const handleSelectSearchResult = (item) => {
    setFormData((prev) => ({
      ...prev,
      lat: Number(item.lat.toFixed(6)),
      lng: Number(item.lng.toFixed(6)),
      state: item.state || prev.state,
      district: item.district || prev.district,
      city: item.city || prev.city,
      zone: item.zone || prev.zone,
      pincode: item.pincode || prev.pincode,
    }));
    setShowSearchResults(false);
    setSearchQuery(item.displayName);
    toast.success(`Selected location: ${item.zone || item.city}`);
  };

  // Reverse Geocode (Lat/Lng -> Address Details) via Backend API Proxy
  const handleReverseGeocode = async (lat, lng) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/service-areas/reverse-geocode`, {
        params: { lat, lng },
      });
      if (res.data.success) {
        setFormData((prev) => ({
          ...prev,
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          state: res.data.state || prev.state,
          district: res.data.district || prev.district,
          city: res.data.city || prev.city,
          zone: res.data.zone || prev.zone,
          pincode: res.data.pincode || prev.pincode,
        }));
        if (res.data.displayName) {
          setSearchQuery(res.data.displayName);
        }
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setFormData((prev) => ({
        ...prev,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      }));
    }
  };

  // Marker Drag End Handler
  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker != null) {
      const { lat, lng } = marker.getLatLng();
      handleReverseGeocode(lat, lng);
    }
  };

  // Fetch Browser Live GPS Location
  const handleFetchLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const liveLat = pos.coords.latitude;
        const liveLng = pos.coords.longitude;
        setIsLocating(false);
        toast.success(`Fetched live location: ${liveLat.toFixed(4)}, ${liveLng.toFixed(4)}`);
        handleReverseGeocode(liveLat, liveLng);
      },
      (err) => {
        setIsLocating(false);
        toast.error(`Location error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleToggle = async (id) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/service-areas/${id}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchAreas();
      }
    } catch (err) {
      toast.error('Failed to toggle service area');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service area?')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/service-areas/${id}`);
      if (res.data.success) {
        toast.success('Service area deleted');
        fetchAreas();
      }
    } catch (err) {
      toast.error('Failed to delete service area');
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setFormData({
      state: 'Madhya Pradesh',
      district: 'Indore',
      city: 'Indore',
      zone: 'Vijay Nagar',
      village: '',
      pincode: '452010',
      deliveryRadiusKm: 25,
      baseDeliveryFee: 30,
      minimumOrderValue: 100,
      peakCharge: 0,
      lat: 22.7533,
      lng: 75.8937,
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (area) => {
    setEditingId(area._id);
    setSearchQuery(`${area.zone || area.city}, ${area.city}`);
    setSearchResults([]);
    setShowSearchResults(false);
    setFormData({
      state: area.state || 'Madhya Pradesh',
      district: area.district || 'Indore',
      city: area.city || 'Indore',
      zone: area.zone || '',
      village: area.village || '',
      pincode: area.pincode || '',
      deliveryRadiusKm: area.deliveryRadiusKm || 25,
      baseDeliveryFee: area.baseDeliveryFee || 30,
      minimumOrderValue: area.minimumOrderValue || 100,
      peakCharge: area.peakCharge || 0,
      lat: area.coordinates?.lat || 22.7533,
      lng: area.coordinates?.lng || 75.8937,
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const res = await axios.put(`${API_BASE_URL}/api/service-areas/${editingId}`, formData);
        if (res.data.success) {
          toast.success('Service area updated successfully');
          setOpenModal(false);
          fetchAreas();
        }
      } else {
        const res = await axios.post(`${API_BASE_URL}/api/service-areas`, formData);
        if (res.data.success) {
          toast.success('Service area added successfully');
          setOpenModal(false);
          fetchAreas();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving service area');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapPin className="text-[#248C70]" size={28} />
            Service Area Radius & Coverage Control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure Pincode-wise, City-wise & 25 KM Radius Service Zones with Real Interactive Leaflet / OpenStreetMap Location Search & Geocoding.
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={fetchAreas}
            sx={{ borderColor: '#d1d5db', color: '#374151', textTransform: 'none', fontWeight: 600 }}
          >
            Refresh List
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' }, textTransform: 'none', fontWeight: 700, px: 2.5 }}
            onClick={handleOpenAdd}
          >
            Add Service Area
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Hierarchy & Zone Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Pincode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Coordinates (Lat, Lng)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Service Radius</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Base Fee</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Min Order</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {areas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#6b7280' }}>
                    <Compass size={40} className="mx-auto mb-2 text-gray-400" />
                    <Typography variant="subtitle1" fontWeight={700}>No active service areas configured yet</Typography>
                    <Typography variant="body2">Click "+ Add Service Area" to set up your 25 KM delivery coverage.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                areas.map((area) => (
                  <TableRow key={area._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MapPin size={16} className="text-[#248C70]" />
                        <span>{`${area.zone || area.city}, ${area.city}, ${area.district} (${area.state})`}</span>
                      </Box>
                      {area.village && <Typography variant="caption" color="text.secondary" display="block">Village: {area.village}</Typography>}
                    </TableCell>
                    <TableCell><Chip label={area.pincode} size="small" variant="outlined" sx={{ fontWeight: 700, borderColor: '#248C70', color: '#248C70' }} /></TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#f3f4f6', px: 1, py: 0.5, borderRadius: 1 }}>
                        {area.coordinates?.lat ? `${area.coordinates.lat.toFixed(4)}, ${area.coordinates.lng.toFixed(4)}` : 'Live Pick'}
                      </Typography>
                    </TableCell>
                    <TableCell><Chip label={`${area.deliveryRadiusKm || 25} km Radius`} color="primary" variant="outlined" size="small" sx={{ bgcolor: '#e8f5e9', color: '#248C70', fontWeight: 800 }} /></TableCell>
                    <TableCell>{`₹${area.baseDeliveryFee}`}</TableCell>
                    <TableCell>{`₹${area.minimumOrderValue}`}</TableCell>
                    <TableCell>
                      <Chip label={area.isServiceActive ? 'ACTIVE' : 'INACTIVE'} color={area.isServiceActive ? 'success' : 'default'} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                        <Switch checked={area.isServiceActive} onChange={() => handleToggle(area._id)} color="success" size="small" />
                        <Tooltip title="Edit Area">
                          <IconButton size="small" onClick={() => handleOpenEdit(area)} sx={{ color: '#3b82f6' }}>
                            <Edit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Area">
                          <IconButton size="small" onClick={() => handleDelete(area._id)} sx={{ color: '#ef4444' }}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Interactive Map & Location Setup Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'visible' } }}>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
          <span>{editingId ? 'Edit Service Area & Radius' : 'Add New Service Area (25 KM Radius)'}</span>
          <Button
            variant="contained"
            size="small"
            startIcon={isLocating ? <CircularProgress size={14} color="inherit" /> : <Navigation size={14} />}
            disabled={isLocating}
            onClick={handleFetchLiveLocation}
            sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' }, textTransform: 'none', fontWeight: 700 }}
          >
            {isLocating ? 'Fetching GPS...' : 'Fetch Live GPS Location'}
          </Button>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Grid container spacing={2}>
            {/* Interactive Real Google Maps View with Live Search, Device GPS & Radius Geofencing */}
            <Grid item xs={12}>
              <GoogleServiceAreaMap
                lat={formData.lat}
                lng={formData.lng}
                radiusKm={formData.deliveryRadiusKm}
                onLocationSelect={(newLat, newLng) => handleReverseGeocode(newLat, newLng)}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic', fontWeight: 500 }}>
                * Real Google Maps: Search location, use device GPS, click/drag pin marker to set exact geofenced coverage radius.
              </Typography>
            </Grid>

            {/* Delivery Radius Slider */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#111827' }}>
                Service Delivery Radius: {formData.deliveryRadiusKm} KM
              </Typography>
              <Slider
                value={formData.deliveryRadiusKm}
                min={1}
                max={50}
                step={1}
                onChange={(e, val) => setFormData({ ...formData, deliveryRadiusKm: val })}
                sx={{ color: '#248C70' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Delivery Radius (KM)"
                type="number"
                fullWidth
                size="small"
                value={formData.deliveryRadiusKm}
                onChange={(e) => setFormData({ ...formData, deliveryRadiusKm: Number(e.target.value) })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField label="State" fullWidth size="small" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="District" fullWidth size="small" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="City" fullWidth size="small" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField label="Zone / Area Name" fullWidth size="small" value={formData.zone} onChange={(e) => setFormData({ ...formData, zone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Village (Optional)" fullWidth size="small" value={formData.village} onChange={(e) => setFormData({ ...formData, village: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Pincode" fullWidth size="small" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField label="Latitude (Lat)" fullWidth size="small" type="number" value={formData.lat} onChange={(e) => setFormData({ ...formData, lat: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Longitude (Lng)" fullWidth size="small" type="number" value={formData.lng} onChange={(e) => setFormData({ ...formData, lng: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Base Delivery Fee (₹)" type="number" fullWidth size="small" value={formData.baseDeliveryFee} onChange={(e) => setFormData({ ...formData, baseDeliveryFee: Number(e.target.value) })} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Min Order Value (₹)" type="number" fullWidth size="small" value={formData.minimumOrderValue} onChange={(e) => setFormData({ ...formData, minimumOrderValue: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Peak Surge Charge (₹)" type="number" fullWidth size="small" value={formData.peakCharge} onChange={(e) => setFormData({ ...formData, peakCharge: Number(e.target.value) })} />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
          <Button onClick={() => setOpenModal(false)} sx={{ color: '#6b7280' }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' }, px: 3, fontWeight: 700 }} onClick={handleSave}>
            {editingId ? 'Save Changes' : 'Create Service Area'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

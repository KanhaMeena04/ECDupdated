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
  Tooltip
} from '@mui/material';
import { Edit2, Trash2, MapPin, Navigation, Compass, Plus, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCN7XqyxOj5lgr2uaMNrTOg6PzHTOGa0xU';

export default function ServiceAreasPage() {
  const [areas, setAreas] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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
  const googleMapObj = useRef(null);
  const markerObj = useRef(null);
  const circleObj = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Load Google Maps API script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsMapLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsMapLoaded(true);
    script.onerror = () => toast.error('Google Maps failed to load');
    document.head.appendChild(script);
  }, []);

  // Initialize Map inside modal
  useEffect(() => {
    if (!openModal || !isMapLoaded || !mapRef.current) return;

    const initialPos = { lat: Number(formData.lat) || 22.7533, lng: Number(formData.lng) || 75.8937 };

    const map = new window.google.maps.Map(mapRef.current, {
      center: initialPos,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });
    googleMapObj.current = map;

    const marker = new window.google.maps.Marker({
      position: initialPos,
      map: map,
      draggable: true,
      title: 'Service Area Center',
    });
    markerObj.current = marker;

    const circle = new window.google.maps.Circle({
      map: map,
      radius: (Number(formData.deliveryRadiusKm) || 25) * 1000,
      fillColor: '#248C70',
      fillOpacity: 0.18,
      strokeColor: '#248C70',
      strokeOpacity: 0.8,
      strokeWeight: 2,
    });
    circle.bindTo('center', marker, 'position');
    circleObj.current = circle;

    // Handle marker drag
    marker.addListener('dragend', (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      reverseGeocode(newLat, newLng);
    });

    // Handle map click
    map.addListener('click', (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      marker.setPosition({ lat: newLat, lng: newLng });
      reverseGeocode(newLat, newLng);
    });

    // Autocomplete input
    if (searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'in' },
      });
      autocomplete.bindTo('bounds', map);
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const newLat = place.geometry.location.lat();
          const newLng = place.geometry.location.lng();
          map.setCenter({ lat: newLat, lng: newLng });
          map.setZoom(13);
          marker.setPosition({ lat: newLat, lng: newLng });
          extractPlaceComponents(place, newLat, newLng);
        }
      });
    }
  }, [openModal, isMapLoaded]);

  // Update radius circle dynamically when slider/input changes
  useEffect(() => {
    if (circleObj.current) {
      circleObj.current.setRadius((Number(formData.deliveryRadiusKm) || 25) * 1000);
    }
  }, [formData.deliveryRadiusKm]);

  // Reverse Geocode (Lat/Lng -> Address Details)
  const reverseGeocode = async (lat, lng) => {
    setFormData((prev) => ({ ...prev, lat, lng }));
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        extractPlaceComponents(results[0], lat, lng);
      }
    });
  };

  const extractPlaceComponents = (place, lat, lng) => {
    let state = 'Madhya Pradesh';
    let district = 'Indore';
    let city = 'Indore';
    let zone = '';
    let pincode = '';

    if (place.address_components) {
      for (const comp of place.address_components) {
        const types = comp.types;
        if (types.includes('administrative_area_level_1')) state = comp.long_name;
        if (types.includes('administrative_area_level_2')) district = comp.long_name;
        if (types.includes('locality')) city = comp.long_name;
        if (types.includes('sublocality') || types.includes('neighborhood') || types.includes('route')) {
          if (!zone) zone = comp.long_name;
        }
        if (types.includes('postal_code')) pincode = comp.long_name;
      }
    }

    setFormData((prev) => ({
      ...prev,
      state: state || prev.state,
      district: district || prev.district,
      city: city || prev.city,
      zone: zone || place.name || prev.zone,
      pincode: pincode || prev.pincode,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
    }));
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

        if (googleMapObj.current && markerObj.current) {
          googleMapObj.current.setCenter({ lat: liveLat, lng: liveLng });
          googleMapObj.current.setZoom(13);
          markerObj.current.setPosition({ lat: liveLat, lng: liveLng });
        }
        reverseGeocode(liveLat, liveLng);
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
    setFormData({
      state: area.state || '',
      district: area.district || '',
      city: area.city || '',
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
            Configure Pincode-wise, City-wise & 25 KM Radius Service Zones with Real Google Maps API location.
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
                    <TableCell><Chip label={`${area.deliveryRadiusKm || 25} km Radius`} color="primary" variant="soft" size="small" sx={{ bgcolor: '#e8f5e9', color: '#248C70', fontWeight: 800 }} /></TableCell>
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

      {/* Interactive Google Map & Location Setup Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{editingId ? 'Edit Service Area & Radius' : 'Add New Service Area (25 KM Radius)'}</span>
          <Button
            variant="contained"
            size="small"
            startIcon={isLocating ? <CircularProgress size={14} color="inherit" /> : <Navigation size={14} />}
            disabled={isLocating}
            onClick={handleFetchLiveLocation}
            sx={{ bgcolor: '#248C70', textTransform: 'none', fontWeight: 700 }}
          >
            {isLocating ? 'Fetching GPS...' : 'Fetch Live GPS Location'}
          </Button>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          <Grid container spacing={2}>
            {/* Search location bar */}
            <Grid item xs={12}>
              <TextField
                inputRef={searchInputRef}
                fullWidth
                size="small"
                label="Search Map Location / Landmark (Google Places API)"
                placeholder="Type area name, landmark or city e.g. Vijay Nagar, Indore..."
                InputProps={{
                  startAdornment: <MapPin size={18} className="text-gray-400 mr-2" />,
                }}
              />
            </Grid>

            {/* Google Map View */}
            <Grid item xs={12}>
              <Box sx={{ width: '100%', height: 260, borderRadius: 2, overflow: 'hidden', border: '2px solid #248C70', position: 'relative' }}>
                <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                {!isMapLoaded && (
                  <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress color="success" />
                  </Box>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                * Click anywhere on map or drag the pin marker to set exact location center & radius.
              </Typography>
            </Grid>

            {/* Delivery Radius Slider */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
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

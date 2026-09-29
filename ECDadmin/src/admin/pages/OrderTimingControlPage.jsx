import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  AccessTime,
  Timer,
  DeliveryDining,
  CancelOutlined,
  CheckCircle,
  SettingsBackupRestore
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

export default function OrderTimingControlPage() {
  const [config, setConfig] = useState({
    cancellationWindowMins: 5,
    riderPickupGracePeriodMins: 15,
    selfPickupGracePeriodMins: 15,
    preparationBufferMins: 10
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/order-timing-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.config) {
        setConfig(res.data.config);
      }
    } catch (err) {
      toast.error('Failed to load order timing configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/api/admin/order-timing-config`, config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Order timing parameters saved and synced across all apps!');
      }
    } catch (err) {
      toast.error('Failed to update order timing configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Timer sx={{ color: '#248C70', fontSize: 30 }} />
          Order Cancellation & Pickup Timing Control
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Configure live real-time countdown windows for customer/restaurant cancellation and delivery rider pickup grace periods across all apps.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Form: Real-time Settings */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3.5, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1F2937', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime sx={{ color: '#F59E0B' }} />
              Live Window Durations
            </Typography>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              These parameters directly drive the live countdown timers in the <b>Restaurant App</b>, <b>User App</b>, and <b>Rider App</b> without hardcoding.
            </Alert>

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  label="Order Cancellation Window (Minutes)"
                  helperText="Active window for full refund order cancellation before cooking begins (e.g., 5 mins)."
                  type="number"
                  inputProps={{ min: 1, max: 60 }}
                  fullWidth
                  value={config.cancellationWindowMins}
                  onChange={(e) => setConfig({ ...config, cancellationWindowMins: Math.max(1, Number(e.target.value)) })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Rider Pickup Grace Period (Minutes)"
                  helperText="Grace period after order assignment/ready for the delivery partner to arrive at the restaurant (e.g., 15 mins)."
                  type="number"
                  inputProps={{ min: 1, max: 120 }}
                  fullWidth
                  value={config.riderPickupGracePeriodMins}
                  onChange={(e) => setConfig({ ...config, riderPickupGracePeriodMins: Math.max(1, Number(e.target.value)) })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Self-Pickup Grace Period (Minutes)"
                  helperText="Time customer has to collect takeaway order after ready mark."
                  type="number"
                  inputProps={{ min: 1, max: 120 }}
                  fullWidth
                  value={config.selfPickupGracePeriodMins}
                  onChange={(e) => setConfig({ ...config, selfPickupGracePeriodMins: Math.max(1, Number(e.target.value)) })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Preparation Buffer Time (Minutes)"
                  helperText="Default kitchen preparation buffer."
                  type="number"
                  inputProps={{ min: 0, max: 60 }}
                  fullWidth
                  value={config.preparationBufferMins}
                  onChange={(e) => setConfig({ ...config, preparationBufferMins: Math.max(0, Number(e.target.value)) })}
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<SettingsBackupRestore />}
                  onClick={() => setConfig({ cancellationWindowMins: 5, riderPickupGracePeriodMins: 15, selfPickupGracePeriodMins: 15, preparationBufferMins: 10 })}
                >
                  Reset Defaults
                </Button>
                <Button
                  variant="contained"
                  disabled={saving}
                  sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1c6f59' }, px: 3, py: 1.2, fontWeight: 700 }}
                  onClick={handleSave}
                >
                  {saving ? 'Saving...' : 'Save & Sync Everywhere'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Preview: Live App Simulation */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4B5563', mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Restaurant App Live UI Preview
            </Typography>

            {/* Simulation Card 1: Cancellation Window */}
            <Card sx={{ mb: 2.5, borderRadius: 2.5, bgcolor: '#FFFBEB', border: '1.5px solid #F59E0B', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timer sx={{ color: '#D97706', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 800, fontSize: 13, color: '#B45309' }}>
                      Order Cancellation Window
                    </Typography>
                  </Box>
                  <Chip
                    label={`${String(config.cancellationWindowMins - 1).padStart(2, '0')}m 50s`}
                    sx={{ bgcolor: '#D97706', color: '#fff', fontWeight: 800, fontSize: 11, height: 24 }}
                  />
                </Box>
                <Typography sx={{ fontSize: 11, color: '#78350F', mb: 1.5 }}>
                  Cancellation window active ({config.cancellationWindowMins} mins). Order can be cancelled with full refund before timer expires.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  startIcon={<CancelOutlined />}
                  sx={{ color: '#DC2626', borderColor: '#DC2626', borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                >
                  Cancel Order (Full Refund)
                </Button>
              </CardContent>
            </Card>

            {/* Simulation Card 2: Rider Grace Period */}
            <Card sx={{ borderRadius: 2.5, bgcolor: '#F0FDF4', border: '1.5px solid #16A34A', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime sx={{ color: '#16A34A', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 800, fontSize: 13, color: '#15803D' }}>
                      Rider Pickup Grace Period
                    </Typography>
                  </Box>
                  <Chip
                    label={`${String(config.riderPickupGracePeriodMins - 1).padStart(2, '0')}m 50s`}
                    sx={{ bgcolor: '#16A34A', color: '#fff', fontWeight: 800, fontSize: 11, height: 24 }}
                  />
                </Box>
                <Typography sx={{ fontSize: 11, color: '#166534' }}>
                  Rider has a {config.riderPickupGracePeriodMins}-min grace period to arrive at store for order pickup.
                </Typography>
              </CardContent>
            </Card>

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ color: '#16A34A', fontSize: 18 }} />
              <Typography sx={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>
                Synced directly with MongoDB AdminSettings.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Divider
} from '@mui/material';
import { Tune, Save, GpsFixed, LocalShipping, StarRate, CurrencyExchange } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

export default function DispatchRankingControlPage() {
  const [dispatchConfig, setDispatchConfig] = useState({
    mode: 'auto_batch',
    searchRadiusKm: 8,
    batchSize: 5,
    reassignmentTimeoutSeconds: 45,
    priorityOrder: 'distance',
    maxActiveOrdersPerRider: 2
  });
  const [rankingConfig, setRankingConfig] = useState({
    distanceWeight: 0.45,
    ratingWeight: 0.30,
    prepTimeWeight: 0.15,
    featuredBoost: 0.10
  });
  const [trackingConfig, setTrackingConfig] = useState({
    gpsIntervalSeconds: 60,
    activeDeliveryOnly: true,
    staleThresholdSeconds: 180
  });
  const [refundConfig, setRefundConfig] = useState({
    mode: 'manual',
    autoRefundReasons: ['restaurant_rejected', 'timeout', 'item_unavailable']
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [dRes, rRes, tRes, refRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/admin/dispatch-config`, { headers }),
          axios.get(`${API_BASE_URL}/api/admin/ranking-config`, { headers }),
          axios.get(`${API_BASE_URL}/api/admin/tracking-config`, { headers }),
          axios.get(`${API_BASE_URL}/api/admin/refund-config`, { headers })
        ]);
        if (dRes.data.config) setDispatchConfig((p) => ({ ...p, ...dRes.data.config }));
        if (rRes.data.config) setRankingConfig((p) => ({ ...p, ...rRes.data.config }));
        if (tRes.data.config) setTrackingConfig((p) => ({ ...p, ...tRes.data.config }));
        if (refRes.data.config) setRefundConfig((p) => ({ ...p, ...refRes.data.config }));
      } catch (err) {
        toast.error('Failed to load operational control configurations');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await Promise.all([
        axios.put(`${API_BASE_URL}/api/admin/dispatch-config`, dispatchConfig, { headers }),
        axios.put(`${API_BASE_URL}/api/admin/ranking-config`, rankingConfig, { headers }),
        axios.put(`${API_BASE_URL}/api/admin/tracking-config`, trackingConfig, { headers }),
        axios.put(`${API_BASE_URL}/api/admin/refund-config`, refundConfig, { headers })
      ]);
      toast.success('Dispatch, Ranking, GPS & Refund rules saved live!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tune sx={{ color: '#248C70', fontSize: 30 }} />
            Dispatch, Ranking, GPS Tracking & Refund Rules
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Central control for rider batch dispatch, restaurant home ranking weights, GPS ping frequency, and auto-refund mode.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Save />} onClick={handleSaveAll} disabled={saving} sx={{ bgcolor: '#248C70' }}>
          {saving ? 'Saving...' : 'Save All Controls'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2.5, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalShipping sx={{ color: '#248C70' }} /> Rider Dispatch Engine
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Search Radius (KM)"
                  type="number"
                  fullWidth
                  size="small"
                  value={dispatchConfig.searchRadiusKm}
                  onChange={(e) => setDispatchConfig({ ...dispatchConfig, searchRadiusKm: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Batch Size (Riders)"
                  type="number"
                  fullWidth
                  size="small"
                  value={dispatchConfig.batchSize}
                  onChange={(e) => setDispatchConfig({ ...dispatchConfig, batchSize: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Reassignment Timeout (Sec)"
                  type="number"
                  fullWidth
                  size="small"
                  value={dispatchConfig.reassignmentTimeoutSeconds}
                  onChange={(e) => setDispatchConfig({ ...dispatchConfig, reassignmentTimeoutSeconds: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rider Priority</InputLabel>
                  <Select
                    label="Rider Priority"
                    value={dispatchConfig.priorityOrder || 'distance'}
                    onChange={(e) => setDispatchConfig({ ...dispatchConfig, priorityOrder: e.target.value })}
                  >
                    <MenuItem value="distance">Closest Distance First</MenuItem>
                    <MenuItem value="rating">Highest Rating First</MenuItem>
                    <MenuItem value="idle_time">Longest Idle Time First</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2.5, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <StarRate sx={{ color: '#F59E0B' }} /> Restaurant Ranking Weights
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Distance Weight (0-1)"
                  type="number"
                  inputProps={{ step: 0.05, min: 0, max: 1 }}
                  fullWidth
                  size="small"
                  value={rankingConfig.distanceWeight}
                  onChange={(e) => setRankingConfig({ ...rankingConfig, distanceWeight: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Rating Weight (0-1)"
                  type="number"
                  inputProps={{ step: 0.05, min: 0, max: 1 }}
                  fullWidth
                  size="small"
                  value={rankingConfig.ratingWeight}
                  onChange={(e) => setRankingConfig({ ...rankingConfig, ratingWeight: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Prep Speed Weight (0-1)"
                  type="number"
                  inputProps={{ step: 0.05, min: 0, max: 1 }}
                  fullWidth
                  size="small"
                  value={rankingConfig.prepTimeWeight}
                  onChange={(e) => setRankingConfig({ ...rankingConfig, prepTimeWeight: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Featured Boost (0-1)"
                  type="number"
                  inputProps={{ step: 0.05, min: 0, max: 1 }}
                  fullWidth
                  size="small"
                  value={rankingConfig.featuredBoost}
                  onChange={(e) => setRankingConfig({ ...rankingConfig, featuredBoost: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <GpsFixed sx={{ color: '#2563EB' }} /> Rider GPS Tracking Policy
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="GPS Ping Interval (Sec)"
                  type="number"
                  helperText="Default: 60s (30s for high frequency)"
                  fullWidth
                  size="small"
                  value={trackingConfig.gpsIntervalSeconds}
                  onChange={(e) => setTrackingConfig({ ...trackingConfig, gpsIntervalSeconds: Math.max(15, Number(e.target.value)) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Stale Threshold (Sec)"
                  type="number"
                  helperText="Customer app shows stale GPS indicator after this"
                  fullWidth
                  size="small"
                  value={trackingConfig.staleThresholdSeconds}
                  onChange={(e) => setTrackingConfig({ ...trackingConfig, staleThresholdSeconds: Math.max(60, Number(e.target.value)) })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(trackingConfig.activeDeliveryOnly)}
                      onChange={(e) => setTrackingConfig({ ...trackingConfig, activeDeliveryOnly: e.target.checked })}
                      color="success"
                    />
                  }
                  label="Continuous GPS Tracking Only During Active Delivery (Auto-stop on completion)"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CurrencyExchange sx={{ color: '#DC2626' }} /> Auto-Refund & Split Rules
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Refund Execution Mode</InputLabel>
              <Select
                label="Refund Execution Mode"
                value={refundConfig.mode || 'manual'}
                onChange={(e) => setRefundConfig({ ...refundConfig, mode: e.target.value })}
              >
                <MenuItem value="manual">Manual Admin Approval Queue</MenuItem>
                <MenuItem value="auto">Auto-Credit Customer Wallet on Eligible Reasons</MenuItem>
              </Select>
            </FormControl>
            <Divider sx={{ my: 1 }} />
            <TextField
              label="Auto-Refund Eligible Reasons (comma separated)"
              fullWidth
              size="small"
              value={(refundConfig.autoRefundReasons || []).join(', ')}
              onChange={(e) =>
                setRefundConfig({
                  ...refundConfig,
                  autoRefundReasons: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                })
              }
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}


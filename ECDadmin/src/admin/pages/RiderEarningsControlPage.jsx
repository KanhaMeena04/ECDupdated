import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Chip,
  Alert
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

export default function RiderEarningsControlPage() {
  const [config, setConfig] = useState({
    payoutModel: 'commission',
    baseEarning: 20,
    baseDistanceKm: 2,
    perKmEarning: 8,
    riderDeliveryFeePercent: 70,
    peakBonus: 10,
    isPeakBonusActive: false,
    rainBonus: 15,
    isRainBonusActive: false,
    nightBonus: 15,
    isNightBonusActive: false,
    codOtpAlertMessage: 'Collect ₹{amount} CASH before entering OTP!',
    onlineOtpAlertMessage: 'Order paid online. Do NOT collect cash!'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/rider-earning-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.config) {
        setConfig((prev) => ({
          ...prev,
          ...res.data.config,
          codOtpAlertMessage: res.data.config.codOtpAlertMessage || 'Collect ₹{amount} CASH before entering OTP!',
          onlineOtpAlertMessage: res.data.config.onlineOtpAlertMessage || 'Order paid online. Do NOT collect cash!'
        }));
      }
    } catch (err) {
      toast.error('Failed to load rider earning config');
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
      const res = await axios.put(`${API_BASE_URL}/api/admin/rider-earning-config`, config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Rider earning model, rates & OTP alerts saved to Database!');
      }
    } catch (err) {
      toast.error('Failed to save rider earning config');
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

  const isCommission = (config.payoutModel || 'commission') === 'commission';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
          Rider Earning & Bonus Control Engine
        </Typography>
        <Chip
          label={isCommission ? 'Active: Commission Share % Model' : 'Active: Fixed Pay + Distance Model'}
          color={isCommission ? 'primary' : 'success'}
          sx={{ fontWeight: 700 }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure payout calculation model (Commission % vs Fixed Base Pay), distance rates, surge bonuses, and dynamic delivery OTP prompt messages.
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Grid container spacing={3}>
          {/* Active Model Selector */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#F9FAFB', borderColor: '#E5E7EB' }}>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
                  Choose Active Rider Payout Model
                </FormLabel>
                <RadioGroup
                  row
                  value={config.payoutModel || 'commission'}
                  onChange={(e) => setConfig({ ...config, payoutModel: e.target.value })}
                >
                  <FormControlLabel
                    value="commission"
                    control={<Radio color="success" />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Commission Share % Model (Default)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Rider earns X% of customer delivery fee + 100% tip.
                        </Typography>
                      </Box>
                    }
                    sx={{ mr: 4 }}
                  />
                  <FormControlLabel
                    value="fixed"
                    control={<Radio color="success" />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Fixed Base Pay + Distance Bonus Model
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Rider earns fixed Base Pay + per-extra-KM fee + Surge bonuses + tip.
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Paper>
          </Grid>

          {/* Model 1: Commission Share */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Rider Delivery Share (%)"
              type="number"
              fullWidth
              value={config.riderDeliveryFeePercent ?? 70}
              onChange={(e) => setConfig({ ...config, riderDeliveryFeePercent: Number(e.target.value) })}
              helperText="Percentage of Customer Delivery Fee given to Rider (e.g. 70%)"
              sx={{ bgcolor: isCommission ? '#ECFDF5' : 'inherit' }}
            />
          </Grid>

          {/* Model 2: Fixed Base Pay & Distance */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Base Delivery Earning (₹)"
              type="number"
              fullWidth
              value={config.baseEarning}
              onChange={(e) => setConfig({ ...config, baseEarning: Number(e.target.value) })}
              helperText="Fixed amount paid for base distance"
              sx={{ bgcolor: !isCommission ? '#ECFDF5' : 'inherit' }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Base Distance (km)"
              type="number"
              fullWidth
              value={config.baseDistanceKm}
              onChange={(e) => setConfig({ ...config, baseDistanceKm: Number(e.target.value) })}
              helperText="Distance covered in base pay"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Per KM Rate (₹/km)"
              type="number"
              fullWidth
              value={config.perKmEarning}
              onChange={(e) => setConfig({ ...config, perKmEarning: Number(e.target.value) })}
              helperText="Extra per KM after base distance"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider>Surge Bonus Rules (Fixed Distance Model)</Divider>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormControlLabel
                control={<Switch checked={config.isPeakBonusActive} onChange={(e) => setConfig({ ...config, isPeakBonusActive: e.target.checked })} color="success" />}
                label="Peak Bonus"
              />
              <TextField
                label="Peak Bonus Amount (₹)"
                type="number"
                fullWidth
                size="small"
                sx={{ mt: 1 }}
                value={config.peakBonus}
                onChange={(e) => setConfig({ ...config, peakBonus: Number(e.target.value) })}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormControlLabel
                control={<Switch checked={config.isRainBonusActive} onChange={(e) => setConfig({ ...config, isRainBonusActive: e.target.checked })} color="success" />}
                label="Rain Bonus"
              />
              <TextField
                label="Rain Bonus Amount (₹)"
                type="number"
                fullWidth
                size="small"
                sx={{ mt: 1 }}
                value={config.rainBonus}
                onChange={(e) => setConfig({ ...config, rainBonus: Number(e.target.value) })}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormControlLabel
                control={<Switch checked={config.isNightBonusActive} onChange={(e) => setConfig({ ...config, isNightBonusActive: e.target.checked })} color="success" />}
                label="Night Bonus"
              />
              <TextField
                label="Night Bonus Amount (₹)"
                type="number"
                fullWidth
                size="small"
                sx={{ mt: 1 }}
                value={config.nightBonus}
                onChange={(e) => setConfig({ ...config, nightBonus: Number(e.target.value) })}
              />
            </Paper>
          </Grid>

          {/* Delivery OTP Prompt Messages Section */}
          <Grid item xs={12}>
            <Divider>Delivery Completion OTP Alert Cards (Rider App)</Divider>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Yeh messages Rider App me tab dikhenge jab Rider delivery complete karne ke liye customer se OTP maangta hai. Note: <strong>{'{amount}'}</strong> automatically order ke total rupee amount se replace ho jayega.
            </Alert>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid #F59E0B' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#B45309', mb: 1 }}>
                🟠 Cash on Delivery (COD) Warning Alert
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="COD Alert Message"
                value={config.codOtpAlertMessage || ''}
                onChange={(e) => setConfig({ ...config, codOtpAlertMessage: e.target.value })}
                helperText="Example: Collect ₹{amount} CASH before entering OTP!"
              />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid #10B981' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#047857', mb: 1 }}>
                🔵 Online / Prepaid Info Alert
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Online Paid Alert Message"
                value={config.onlineOtpAlertMessage || ''}
                onChange={(e) => setConfig({ ...config, onlineOtpAlertMessage: e.target.value })}
                helperText="Example: Order paid online. Do NOT collect cash!"
              />
            </Paper>
          </Grid>

          <Grid item xs={12} sx={{ textAlign: 'right', mt: 2 }}>
            <Button
              variant="contained"
              disabled={saving}
              sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' }, px: 4, py: 1 }}
              onClick={handleSave}
            >
              {saving ? 'Saving...' : 'Save Rider Earning Config & OTP Alerts'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

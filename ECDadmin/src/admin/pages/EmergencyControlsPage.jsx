import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Switch, FormControlLabel, Button, Divider, TextField } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

export default function EmergencyControlsPage() {
  const [controls, setControls] = useState({
    acceptNewOrders: true,
    deliveryService: true,
    selfPickup: true,
    onlinePayment: true,
    cod: true,
    riderDispatch: true,
    couponsEnabled: true,
    offersEnabled: true,
    reason: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchControls = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/emergency`);
      if (res.data.controls) {
        setControls(res.data.controls);
      }
    } catch (err) {
      toast.error('Failed to load emergency controls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControls();
  }, []);

  const handleToggle = (key) => {
    setControls((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/emergency`, controls);
      if (res.data.success) {
        toast.success('Emergency switches updated successfully!');
      }
    } catch (err) {
      toast.error('Failed to save controls');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
        System Emergency Controls & Kill Switches
      </Typography>
      <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
        Toggle critical platform operational switches in real-time across ECDbackend and all connected mobile apps.
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: controls.acceptNewOrders ? '#f0fdf4' : '#fef2f2' }}>
              <FormControlLabel
                control={<Switch checked={controls.acceptNewOrders} onChange={() => handleToggle('acceptNewOrders')} color="success" />}
                label={<Typography sx={{ fontWeight: 600 }}>Accept New Orders (Global Intake)</Typography>}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Turn OFF to reject all incoming customer checkout attempts backend-wide.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: controls.deliveryService ? '#f0fdf4' : '#fef2f2' }}>
              <FormControlLabel
                control={<Switch checked={controls.deliveryService} onChange={() => handleToggle('deliveryService')} color="success" />}
                label={<Typography sx={{ fontWeight: 600 }}>Delivery Service Switch</Typography>}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Turn OFF to temporarily suspend doorstep delivery options across all zones.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: controls.selfPickup ? '#f0fdf4' : '#fef2f2' }}>
              <FormControlLabel
                control={<Switch checked={controls.selfPickup} onChange={() => handleToggle('selfPickup')} color="success" />}
                label={<Typography sx={{ fontWeight: 600 }}>Self Pickup Orders Switch</Typography>}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Turn OFF to disable Self Pickup selection in the Customer App.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: controls.cod ? '#f0fdf4' : '#fef2f2' }}>
              <FormControlLabel
                control={<Switch checked={controls.cod} onChange={() => handleToggle('cod')} color="success" />}
                label={<Typography sx={{ fontWeight: 600 }}>Cash On Delivery (COD)</Typography>}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Turn OFF to restrict payments exclusively to online digital methods.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: controls.riderDispatch ? '#f0fdf4' : '#fef2f2' }}>
              <FormControlLabel
                control={<Switch checked={controls.riderDispatch} onChange={() => handleToggle('riderDispatch')} color="success" />}
                label={<Typography sx={{ fontWeight: 600 }}>Rider Auto Dispatch Engine</Typography>}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Turn OFF to pause automated rider assignment tasks.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: controls.couponsEnabled ? '#f0fdf4' : '#fef2f2' }}>
              <FormControlLabel
                control={<Switch checked={controls.couponsEnabled} onChange={() => handleToggle('couponsEnabled')} color="success" />}
                label={<Typography sx={{ fontWeight: 600 }}>Promo Codes & Coupons Engine</Typography>}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Turn OFF to prevent discount coupon applications during checkout.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <TextField
              label="Emergency Reason / Internal Note"
              fullWidth
              multiline
              rows={2}
              value={controls.reason}
              onChange={(e) => setControls({ ...controls, reason: e.target.value })}
              placeholder="e.g. Heavy rainfall severe weather alert across Sohnal/Indore region."
            />
          </Grid>

          <Grid item xs={12} sx={{ textAlign: 'right' }}>
            <Button variant="contained" size="large" sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }} onClick={handleSave}>
              Save Emergency Control State
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

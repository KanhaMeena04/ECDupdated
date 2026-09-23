import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel, Divider } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function RiderEarningsControlPage() {
  const [config, setConfig] = useState({
    baseEarning: 20,
    baseDistanceKm: 2,
    perKmEarning: 8,
    peakBonus: 10,
    isPeakBonusActive: false,
    rainBonus: 15,
    isRainBonusActive: false,
    nightBonus: 15,
    isNightBonusActive: false
  });

  const handleSave = async () => {
    try {
      toast.success('Rider base rates & bonus structure updated!');
    } catch (err) {
      toast.error('Failed to save rider earning config');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
        Rider Earning & Bonus Control Engine
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure base earnings, distance slabs, surge bonuses (peak/rain/night), and incentive targets for riders.
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField label="Base Delivery Earning (₹)" type="number" fullWidth value={config.baseEarning} onChange={(e) => setConfig({ ...config, baseEarning: Number(e.target.value) })} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Base Distance (km)" type="number" fullWidth value={config.baseDistanceKm} onChange={(e) => setConfig({ ...config, baseDistanceKm: Number(e.target.value) })} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Per KM Earning Rate (₹/km)" type="number" fullWidth value={config.perKmEarning} onChange={(e) => setConfig({ ...config, perKmEarning: Number(e.target.value) })} />
          </Grid>

          <Grid item xs={12}><Divider>Surge Bonus Rules</Divider></Grid>

          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormControlLabel control={<Switch checked={config.isPeakBonusActive} onChange={(e) => setConfig({ ...config, isPeakBonusActive: e.target.checked })} color="success" />} label="Peak Bonus" />
              <TextField label="Peak Bonus Amount (₹)" type="number" fullWidth size="small" sx={{ mt: 1 }} value={config.peakBonus} onChange={(e) => setConfig({ ...config, peakBonus: Number(e.target.value) })} />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormControlLabel control={<Switch checked={config.isRainBonusActive} onChange={(e) => setConfig({ ...config, isRainBonusActive: e.target.checked })} color="success" />} label="Rain Bonus" />
              <TextField label="Rain Bonus Amount (₹)" type="number" fullWidth size="small" sx={{ mt: 1 }} value={config.rainBonus} onChange={(e) => setConfig({ ...config, rainBonus: Number(e.target.value) })} />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormControlLabel control={<Switch checked={config.isNightBonusActive} onChange={(e) => setConfig({ ...config, isNightBonusActive: e.target.checked })} color="success" />} label="Night Bonus" />
              <TextField label="Night Bonus Amount (₹)" type="number" fullWidth size="small" sx={{ mt: 1 }} value={config.nightBonus} onChange={(e) => setConfig({ ...config, nightBonus: Number(e.target.value) })} />
            </Paper>
          </Grid>

          <Grid item xs={12} sx={{ textAlign: 'right' }}>
            <Button variant="contained" sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' } }} onClick={handleSave}>
              Save Rider Earning Config
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

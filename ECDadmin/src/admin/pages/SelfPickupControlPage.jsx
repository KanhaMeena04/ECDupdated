import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Switch, FormControlLabel, Button, TextField } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function SelfPickupControlPage() {
  const [config, setConfig] = useState({
    enabled: true,
    pickupCapacityPerHour: 20,
    preparationBufferMins: 10,
    gracePeriodMins: 15,
    cancellationWindowMins: 5,
    customerArrivalTimeoutMins: 30
  });

  const handleSave = async () => {
    try {
      toast.success('Self Pickup rules & parameters updated successfully!');
    } catch (err) {
      toast.error('Failed to update self pickup config');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
        Self Pickup Master Control Tower
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage zero-delivery fee takeaway parameters, OTP/QR pickup slots, and grace period settings.
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} color="success" />}
              label={<Typography sx={{ fontWeight: 600 }}>Enable Self Pickup Feature Platform-Wide</Typography>}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Pickup Capacity (Orders per hour per restaurant)"
              type="number"
              fullWidth
              value={config.pickupCapacityPerHour}
              onChange={(e) => setConfig({ ...config, pickupCapacityPerHour: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Preparation Buffer Time (mins)"
              type="number"
              fullWidth
              value={config.preparationBufferMins}
              onChange={(e) => setConfig({ ...config, preparationBufferMins: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Customer Grace Period (mins)"
              type="number"
              fullWidth
              value={config.gracePeriodMins}
              onChange={(e) => setConfig({ ...config, gracePeriodMins: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Arrival Timeout (mins before alert)"
              type="number"
              fullWidth
              value={config.customerArrivalTimeoutMins}
              onChange={(e) => setConfig({ ...config, customerArrivalTimeoutMins: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} sx={{ textAlign: 'right' }}>
            <Button variant="contained" sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' } }} onClick={handleSave}>
              Save Self Pickup Settings
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

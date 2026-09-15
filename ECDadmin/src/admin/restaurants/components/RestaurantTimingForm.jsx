import React from 'react';
import { TextField, Checkbox, FormControlLabel, Typography, Grid } from '@mui/material';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const RestaurantTimingForm = () => {
  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="grid grid-cols-4 gap-4 mb-4 font-bold text-gray-600">
        <div>Day</div>
        <div>Restaurant Opens*</div>
        <div>Restaurant Closes*</div>
        <div className="text-center">Is Holiday?</div>
      </div>
      {days.map((day) => (
        <Grid container spacing={2} key={day} alignItems="center" className="mb-6">
          <Grid item xs={3}>
            <Typography>{day}</Typography>
          </Grid>
          <Grid item xs={3} className="space-y-2">
            <TextField fullWidth size="small" placeholder="Open Time" type="time" InputLabelProps={{ shrink: true }} />
            <TextField fullWidth size="small" placeholder="Second Open Time" type="time" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={3} className="space-y-2">
            <TextField fullWidth size="small" placeholder="Close Time" type="time" InputLabelProps={{ shrink: true }} />
            <TextField fullWidth size="small" placeholder="Second Close Time" type="time" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={3} className="flex justify-center">
            <Checkbox color="primary" />
          </Grid>
        </Grid>
      ))}
    </div>
  );
};

export default RestaurantTimingForm;
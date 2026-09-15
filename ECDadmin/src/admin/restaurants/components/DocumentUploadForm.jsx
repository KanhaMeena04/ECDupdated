import React from 'react';
import { Button, TextField, Grid, Typography } from '@mui/material';

const DocumentUpload = () => {
  const uploadFields = ["FSSAI certificate", "Restaurant License", "Carte d'identité"];

  return (
    <div className="p-6 bg-white">
      <Grid container spacing={4}>
        {uploadFields.map((label) => (
          <Grid item xs={12} md={6} key={label}>
            <Typography className="mb-2 font-medium text-gray-700">{label}</Typography>
            <div className="flex items-center gap-2 mb-2">
              <TextField fullWidth size="small" disabled placeholder="No file chosen" />
              <Button variant="outlined" component="label" sx={{ borderColor: '#ccc', color: '#666' }}>
                Browse <input type="file" hidden />
              </Button>
            </div>
            <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <span className="text-gray-400 text-4xl">🖼️</span>
            </div>
            {label === "Restaurant License" && (
              <div className="mt-4">
                <Typography className="mb-2">Restaurant License Expiry Date</Typography>
                <TextField type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />
              </div>
            )}
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default DocumentUpload;
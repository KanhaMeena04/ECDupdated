import React from 'react';
import { TextField, Grid, Button } from '@mui/material';

const BankDetailsForm = () => {
  const fields = [
    { label: "Account Name*", placeholder: "ab" },
    { label: "Bank Name*", placeholder: "ab" },
    { label: "Account Address*", placeholder: "ab" },
    { label: "Branch Name*", placeholder: "ab" },
    { label: "Account Number*", placeholder: "ab" },
    { label: "Branch Address*", placeholder: "ab" },
    { label: "Swift Code", placeholder: "Enter Swift Code" },
    { label: "Routing Number", placeholder: "Enter Routing Number" },
  ];

  return (
    <div className="p-6 bg-white shadow-sm rounded-xl">
      <Grid container spacing={3}>
        {fields.map((f) => (
          <Grid item xs={12} md={6} key={f.label}>
            <label className="block text-sm font-medium text-gray-600 mb-1">{f.label}</label>
            <TextField fullWidth size="small" placeholder={f.placeholder} />
          </Grid>
        ))}
      </Grid>
      <div className="flex justify-end mt-6">
        <Button variant="contained" sx={{ bgcolor: '#00a684', '&:hover': { bgcolor: '#008a6d' } }}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default BankDetailsForm;
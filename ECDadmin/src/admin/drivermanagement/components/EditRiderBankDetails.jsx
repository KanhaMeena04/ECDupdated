import React from 'react';
import { TextField, Button, Grid, Box, Typography, InputAdornment } from '@mui/material';
import { AccountBalance, Person, LocationOn } from '@mui/icons-material';

const BRAND_MAIN = "#ed2026";
const BRAND_BG_LIGHT = "#FFF5F2";

const EditRiderBankDetailsForm = ({ prevStep, loading, bankDetails, handleNestedChange, submitRider }) => {
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: '12px',
      backgroundColor: '#fff',
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: BRAND_MAIN }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Box className="mb-10 flex items-center gap-4">
        <Box sx={{ bgcolor: BRAND_MAIN, p: 1.5, borderRadius: '15px', display: 'flex' }}>
          <AccountBalance sx={{ color: '#fff' }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={900} sx={{ color: '#1a1a1a', letterSpacing: -0.5 }}>BANK ACCOUNT SETTINGS</Typography>
          <Typography variant="caption" sx={{ color: 'gray', fontWeight: 600, textTransform: 'uppercase' }}>
            Ensure details match the rider's legal passbook
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: { xs: 3, md: 5 }, borderRadius: '24px', background: `linear-gradient(135deg, #ffffff 0%, ${BRAND_BG_LIGHT} 100%)`, border: '1px solid #fee2e2', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
        <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 800, color: BRAND_MAIN, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person fontSize="small" /> BENEFICIARY DETAILS
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth label="Account Holder Name" variant="outlined"
              value={bankDetails?.accountName || ""}
              onChange={(e) => handleNestedChange('bankDetails', 'accountName', e.target.value)}
              sx={inputSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth label="Account Number" variant="outlined"
              value={bankDetails?.accountNumber || ""}
              onChange={(e) => handleNestedChange('bankDetails', 'accountNumber', e.target.value)}
              sx={inputSx}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="Account Holder Address" variant="outlined" multiline rows={2}
              value={bankDetails?.branchAddress || ""}
              onChange={(e) => handleNestedChange('bankDetails', 'branchAddress', e.target.value)}
              sx={inputSx}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 6 }}>
          <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 800, color: 'gray', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn fontSize="small" /> BANK & BRANCH LOGISTICS
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Bank Name"
                value={bankDetails?.bankName || ""}
                onChange={(e) => handleNestedChange('bankDetails', 'bankName', e.target.value)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Branch Name"
                value={bankDetails?.branchName || ""}
                onChange={(e) => handleNestedChange('bankDetails', 'branchName', e.target.value)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Swift Code" placeholder="Optional"
                value={bankDetails?.swiftCode || ""}
                onChange={(e) => handleNestedChange('bankDetails', 'swiftCode', e.target.value)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Routing Number" placeholder="Optional"
                value={bankDetails?.routingNumber || ""}
                onChange={(e) => handleNestedChange('bankDetails', 'routingNumber', e.target.value)}
                sx={inputSx}
              />
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'flex-end', gap: 2, mt: 8, pt: 4, borderTop: '1px solid #f1f5f9' }}>
        <Button onClick={prevStep} variant="text" sx={{ color: 'gray', px: 4, fontWeight: 'bold', order: { xs: 2, sm: 1 } }}>
          Back
        </Button>

        <Button onClick={submitRider} variant="contained" disabled={loading} sx={{ backgroundColor: BRAND_MAIN, '&:hover': { backgroundColor: '#c41a1f', transform: 'scale(1.02)' }, px: { xs: 4, sm: 8 }, py: 1.8, width: { xs: '100%', sm: 'auto' }, borderRadius: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, boxShadow: '0 10px 20px rgba(237,32,38,0.2)', order: { xs: 1, sm: 2 } }}>
          {loading ? "Updating..." : "Finalize & Save"}
        </Button>
      </Box>
    </div>
  );
};

export default EditRiderBankDetailsForm;

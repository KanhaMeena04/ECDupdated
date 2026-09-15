import React, { useState } from 'react';
import { TextField, Button } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

const CountryForm = () => {
  const [formData, setFormData] = useState({
    country: '',
    countryCode: '',
    currencyCode: '',
    currencySymbol: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    console.log('Saved Data:', formData);
    // Add your submit logic here
  };
const BRAND_MAIN = "#ed2026";
const BRAND_BG_LIGHT = "#FFF5F2";

  return (
<div className="min-h-screen bg-gray-50 p-8">
  {/* Container Card */}
  <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
    
    {/* Header Section with Tutorial Button */}
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
        Country Settings
      </h2>
      <button 
        style={{ backgroundColor: BRAND_BG_LIGHT, color: BRAND_MAIN }}
        className="flex items-center gap-2 hover:opacity-80 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-red-100"
      >
        <PlayCircleOutlineIcon fontSize="small" />
        Video Tutorial
      </button>
    </div>

    {/* Form Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
      
      {/* Country Field */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 text-xs font-bold uppercase tracking-wider">Country</label>
        <TextField
          fullWidth
          name="country"
          placeholder="e.g. India"
          variant="outlined"
          size="medium"
          value={formData.country}
          onChange={handleChange}
          sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN } }}
        />
      </div>

      {/* Country Code Field */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 text-xs font-bold uppercase tracking-wider">Country Code</label>
        <TextField
          fullWidth
          name="countryCode"
          placeholder="e.g. +91"
          variant="outlined"
          size="medium"
          value={formData.countryCode}
          onChange={handleChange}
          sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN } }}
        />
      </div>

      {/* Currency Code Field */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 text-xs font-bold uppercase tracking-wider">Currency Code</label>
        <TextField
          fullWidth
          name="currencyCode"
          placeholder="e.g. INR"
          variant="outlined"
          size="medium"
          value={formData.currencyCode}
          onChange={handleChange}
          sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN } }}
        />
      </div>

      {/* Currency Symbol Field */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 text-xs font-bold uppercase tracking-wider">Currency Symbol</label>
        <TextField
          fullWidth
          name="currencySymbol"
          placeholder="e.g. ₹"
          variant="outlined"
          size="medium"
          value={formData.currencySymbol}
          onChange={handleChange}
          sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN } }}
        />
      </div>
    </div>

    {/* Action Button */}
    <div className="mt-10 pt-6 border-t border-gray-50">
      <Button
        variant="contained"
        onClick={handleSave}
        sx={{
          backgroundColor: BRAND_MAIN,
          '&:hover': {
            backgroundColor: '#c41a1f',
          },
          textTransform: 'none',
          paddingX: '48px',
          paddingY: '12px',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: '700',
          boxShadow: '0 4px 14px 0 rgba(237, 32, 38, 0.3)'
        }}
      >
        Save Settings
      </Button>
    </div>
  </div>
</div>
  );
};

export default CountryForm;
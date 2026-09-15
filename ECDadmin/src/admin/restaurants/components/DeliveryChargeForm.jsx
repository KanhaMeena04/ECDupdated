import React from 'react';
import { Radio, RadioGroup, FormControlLabel, FormControl, TextField, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const DeliveryChargeForm = () => {
  return (
    <div className="p-6 bg-white">
      <FormControl component="fieldset">
        <label className="text-gray-600 font-medium">Delivery Charge Based On</label>
        <RadioGroup row defaultValue="price">
          <FormControlLabel value="price" control={<Radio sx={{ color: '#00a684', '&.Mui-checked': { color: '#00a684' } }} />} label="Price" />
          <FormControlLabel value="distance" control={<Radio />} label="Distance (km/miles)" />
        </RadioGroup>
      </FormControl>

      <div className="mt-6">
        <label className="block text-gray-600 font-medium mb-2">VAT</label>
        <TextField defaultValue="12" size="small" className="w-full md:w-1/2" />
      </div>

      <div className="mt-8 flex gap-4">
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          sx={{ bgcolor: '#00a684', '&:hover': { bgcolor: '#008a6d' }, textTransform: 'none' }}
        >
          Add New Row
        </Button>
        <Button 
          variant="contained" 
          startIcon={<CloseIcon />}
          sx={{ bgcolor: '#f45b5b', '&:hover': { bgcolor: '#d44a4a' }, textTransform: 'none' }}
        >
          Remove Last Row
        </Button>
      </div>

      <div className="flex justify-end mt-10">
        <Button variant="contained" sx={{ bgcolor: '#00a684', px: 4 }}>Save</Button>
      </div>
    </div>
  );
};

export default DeliveryChargeForm;
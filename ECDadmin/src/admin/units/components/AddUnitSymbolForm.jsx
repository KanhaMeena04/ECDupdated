import React, { useState } from 'react';
import { 
  TextField, 
  Autocomplete, 
  Button, 
 } from '@mui/material';

const AddUnitSymbolForm = () => {

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6 max-w-full">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Unit Name(Symbol)</label>
            <TextField
              fullWidth
              placeholder="Name"
              variant="outlined"
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { height: '38px' } }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Status</label>
            <Autocomplete
              size="small"
              options={['active', 'inactive']}
              defaultValue="active"
              renderInput={(params) => <TextField {...params} variant="outlined" />}
              sx={{ '& .MuiOutlinedInput-root': { height: '38px' } }}
            />
          </div>
        </div>

        <div className="flex justify-start">
          <Button 
            variant="contained" 
            sx={{ 
              backgroundColor: '#248C70', 
              '&:hover': { backgroundColor: '#1c6d57' },
              textTransform: 'none',
              px: 3,
              borderRadius: '4px',
              boxShadow: 'none'
            }}
          >
            Save
          </Button>
        </div>

      </div>
    </div>
  );
};

export default AddUnitSymbolForm;
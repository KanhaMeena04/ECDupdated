import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Tabs, 
  Tab, 
  Box, 
  MenuItem, 
  Select, 
  FormControl 
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import TranslateIcon from '@mui/icons-material/Translate';

const StateForm = () => {
  const [language, setLanguage] = useState(0); // 0 for English, 1 for Arabic
  const [stateName, setStateName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');

  const handleTabChange = (event, newValue) => {
    setLanguage(newValue);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        
        {/* Header: Tabs and Video Tutorial */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-100">
          <Tabs 
            value={language} 
            onChange={handleTabChange}
            TabIndicatorProps={{ style: { backgroundColor: '#248C70', height: '3px' } }}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, minWidth: 100 },
              '& .Mui-selected': { color: '#248C70 !important' },
            }}
          >
            <Tab icon={<TranslateIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="English" />
            <Tab icon={<TranslateIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Arabic" />
          </Tabs>

          <button className="flex items-center gap-2 bg-[#fdf2d0] hover:bg-[#fbe9b3] text-[#856404] px-4 py-2 rounded-md text-sm font-medium transition-colors">
            <PlayCircleOutlineIcon fontSize="small" />
            Video Tutorial
          </button>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* State Input */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-500 text-sm">State</label>
            <TextField
              fullWidth
              placeholder="State"
              variant="outlined"
              size="small"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
            />
          </div>

          {/* Country Select */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-500 text-sm">Country</label>
            <FormControl fullWidth size="small">
              <Select
                displayEmpty
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <span className="text-gray-400">Select Country</span>;
                  }
                  return selected;
                }}
              >
                <MenuItem value="United States">United States</MenuItem>
                <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                <MenuItem value="India">India</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Save Button */}
        <div>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#248C70',
              '&:hover': { backgroundColor: '#1c6d57' },
              textTransform: 'none',
              paddingX: '30px',
              paddingY: '8px',
              borderRadius: '6px',
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

export default StateForm;
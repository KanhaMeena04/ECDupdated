import React, { useState } from 'react';
import { 
  TextField, 
  MenuItem, 
  Button, 
  Box, 
  Typography 
} from '@mui/material';

const CustomPushForm = () => {
  const [formData, setFormData] = useState({
    sendTo: '',
    title: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    console.log('Push Data Saved:', formData);
    // Add your API logic here
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Container with Tailwind styling */}
      <div className="max-w-7xl mx-auto bg-white rounded-md shadow-sm border border-gray-200">
        
        {/* Header Section */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <Typography variant="h6" className="text-gray-700 font-medium">
            Custom Push
          </Typography>
          <div className="text-gray-400 cursor-pointer">
            {/* Code Icon Placeholder */}
            <span className="text-sm font-mono">&lt; &gt;</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          
          {/* Send To - Select Dropdown */}
          <Box>
            <label className="block text-sm text-gray-500 mb-1">Send To*</label>
            <TextField
              select
              fullWidth
              name="sendTo"
              value={formData.sendTo}
              onChange={handleChange}
              variant="outlined"
              size="small"
              placeholder="Send To"
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="ios">iOS Users</MenuItem>
              <MenuItem value="android">Android Users</MenuItem>
            </TextField>
          </Box>

          {/* Title - Input */}
          <Box>
            <label className="block text-sm text-gray-500 mb-1">Title</label>
            <TextField
              fullWidth
              name="title"
              value={formData.title}
              onChange={handleChange}
              variant="outlined"
              size="small"
              placeholder="Title"
            />
          </Box>

          {/* Message - Textarea */}
          <Box>
            <label className="block text-sm text-gray-500 mb-1">Message</label>
            <TextField
              fullWidth
              name="message"
              value={formData.message}
              onChange={handleChange}
              variant="outlined"
              multiline
              rows={4}
              placeholder="Message"
              // Tailwind class to allow manual resize like in the screenshot
              className="resize-y"
            />
          </Box>

          {/* Action Button */}
          <div className="pt-2">
            <Button 
              variant="contained" 
              onClick={handleSave}
              className="bg-[#00a689] hover:bg-[#1c6d57] capitalize px-6 py-2"
              sx={{ backgroundColor: '#00a689', '&:hover': { backgroundColor: '#1c6d57' } }}
            >
              Save
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomPushForm;
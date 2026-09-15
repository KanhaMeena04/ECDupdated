import React, { useState } from 'react';
import { 
  TextField, 
  MenuItem, 
  Button, 
  IconButton,
  Typography 
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';

const AdminCustomPushForm = () => {
  const [formData, setFormData] = useState({
    sendTo: '',
    title: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Form Data Submitted:", formData);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Main Card Container */}
      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Top Header with Icon */}
        <div className="flex justify-end p-2 border-b border-gray-100">
          <IconButton size="small" className="text-gray-400">
            <CodeIcon fontSize="small" />
          </IconButton>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          
          {/* Send To Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Send To*</label>
            <TextField
              select
              fullWidth
              size="small"
              name="sendTo"
              value={formData.sendTo}
              onChange={handleChange}
              placeholder="Send To"
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="" disabled>
                <span className="text-gray-400">Send To</span>
              </MenuItem>
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="ios">iOS Only</MenuItem>
              <MenuItem value="android">Android Only</MenuItem>
            </TextField>
          </div>

          {/* Title Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Title</label>
            <TextField
              fullWidth
              size="small"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Title"
              variant="outlined"
            />
          </div>

          {/* Message Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Message</label>
            <TextField
              fullWidth
              multiline
              rows={4}
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Message"
              variant="outlined"
              // Matches the resize handle look in the screenshot
              sx={{ '& .MuiInputBase-root': { padding: '10px' } }}
            />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              variant="contained"
              onClick={handleSave}
              className="bg-[#00a689] hover:bg-[#1c6d57] text-white px-6 py-2 normal-case font-medium rounded shadow-none"
              sx={{ 
                backgroundColor: '#00a689', 
                '&:hover': { backgroundColor: '#1c6d57' },
                textTransform: 'none'
              }}
            >
              Save
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminCustomPushForm;
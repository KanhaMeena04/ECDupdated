import React, { useState } from 'react';
import { 
  TextField, 
  MenuItem, 
  Button, 
  Box, 
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../../utils/utils';
import toast from 'react-hot-toast';

const CustomPushForm = () => {
  const [formData, setFormData] = useState({
    sendTo: 'all',
    title: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (feedback) setFeedback(null);
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formData.title || !formData.title.trim()) {
      toast.error('Please enter a notification title');
      setFeedback({ type: 'error', text: 'Please enter a notification title' });
      return;
    }

    if (!formData.message || !formData.message.trim()) {
      toast.error('Please enter a notification message');
      setFeedback({ type: 'error', text: 'Please enter a notification message' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const payload = {
      sendTo: formData.sendTo || 'all',
      title: formData.title.trim(),
      message: formData.message.trim()
    };

    try {
      let res;
      try {
        res = await axios.post(`${API_BASE_URL}/api/notifications/custom-push`, payload, {
          headers,
          withCredentials: true
        });
      } catch (firstErr) {
        // Fallback to /api/admin/custom-push
        res = await axios.post(`${API_BASE_URL}/api/admin/custom-push`, payload, {
          headers,
          withCredentials: true
        });
      }

      if (res.data && res.data.success) {
        const successMsg = res.data.message || 'Custom push notification sent successfully!';
        toast.success(successMsg);
        setFeedback({ type: 'success', text: successMsg });
        setFormData((prev) => ({
          ...prev,
          title: '',
          message: ''
        }));
      } else {
        const errorMsg = res.data?.message || 'Failed to send push notification';
        toast.error(errorMsg);
        setFeedback({ type: 'error', text: errorMsg });
      }
    } catch (err) {
      console.error('Custom push failed:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to send push notification';
      toast.error(errMsg);
      setFeedback({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
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
          {feedback && (
            <Alert 
              severity={feedback.type} 
              onClose={() => setFeedback(null)}
              className="mb-4"
            >
              {feedback.text}
            </Alert>
          )}

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
              <MenuItem value="all">All Users & Partners</MenuItem>
              <MenuItem value="customers">All Customers</MenuItem>
              <MenuItem value="riders">All Delivery Riders</MenuItem>
              <MenuItem value="restaurants">All Restaurants</MenuItem>
              <MenuItem value="android">Android Users</MenuItem>
              <MenuItem value="ios">iOS Users</MenuItem>
            </TextField>
          </Box>

          {/* Title - Input */}
          <Box>
            <label className="block text-sm text-gray-500 mb-1">Title*</label>
            <TextField
              fullWidth
              name="title"
              value={formData.title}
              onChange={handleChange}
              variant="outlined"
              size="small"
              placeholder="Enter notification title"
            />
          </Box>

          {/* Message - Textarea */}
          <Box>
            <label className="block text-sm text-gray-500 mb-1">Message*</label>
            <TextField
              fullWidth
              name="message"
              value={formData.message}
              onChange={handleChange}
              variant="outlined"
              multiline
              rows={4}
              placeholder="Enter notification message"
              className="resize-y"
            />
          </Box>

          {/* Action Button */}
          <div className="pt-2 flex items-center gap-4">
            <Button 
              variant="contained" 
              onClick={handleSave}
              disabled={loading}
              className="bg-[#00a689] hover:bg-[#1c6d57] capitalize px-6 py-2"
              sx={{ backgroundColor: '#00a689', '&:hover': { backgroundColor: '#1c6d57' } }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <CircularProgress size={18} color="inherit" />
                  <span>SENDING...</span>
                </div>
              ) : (
                'SAVE'
              )}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomPushForm;
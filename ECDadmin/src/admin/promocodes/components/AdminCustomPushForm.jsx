import React, { useState } from 'react';
import { 
  TextField, 
  MenuItem, 
  Button, 
  IconButton,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import axios from 'axios';
import { API_BASE_URL } from '../../../utils/utils';
import toast from 'react-hot-toast';

const AdminCustomPushForm = () => {
  const [formData, setFormData] = useState({
    sendTo: 'all',
    title: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        res = await axios.post(`${API_BASE_URL}/api/admin/custom-push`, payload, {
          headers,
          withCredentials: true
        });
      }

      if (res.data && res.data.success) {
        const successMsg = res.data.message || 'Custom push notification sent successfully!';
        toast.success(successMsg);
        setFeedback({ type: 'success', text: successMsg });
        setFormData(prev => ({ ...prev, title: '', message: '' }));
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
          {feedback && (
            <Alert 
              severity={feedback.type} 
              onClose={() => setFeedback(null)}
              className="mb-4"
            >
              {feedback.text}
            </Alert>
          )}

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
            >
              <MenuItem value="all">All Users & Partners</MenuItem>
              <MenuItem value="customers">All Customers</MenuItem>
              <MenuItem value="riders">All Delivery Riders</MenuItem>
              <MenuItem value="restaurants">All Restaurants</MenuItem>
              <MenuItem value="android">Android Users</MenuItem>
              <MenuItem value="ios">iOS Users</MenuItem>
            </TextField>
          </div>

          {/* Title Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Title*</label>
            <TextField
              fullWidth
              size="small"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter notification title"
              variant="outlined"
            />
          </div>

          {/* Message Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Message*</label>
            <TextField
              fullWidth
              multiline
              rows={4}
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Enter notification message"
              variant="outlined"
              sx={{ '& .MuiInputBase-root': { padding: '10px' } }}
            />
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center gap-4">
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              className="bg-[#00a689] hover:bg-[#1c6d57] text-white px-6 py-2 normal-case font-medium rounded shadow-none"
              sx={{ 
                backgroundColor: '#00a689', 
                '&:hover': { backgroundColor: '#1c6d57' },
                textTransform: 'none'
              }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <CircularProgress size={18} color="inherit" />
                  <span>SENDING...</span>
                </div>
              ) : (
                'Save'
              )}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminCustomPushForm;
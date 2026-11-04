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
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import api from '../../../utils/api';
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

  const handleSend = async (e) => {
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

    const payload = {
      sendTo: formData.sendTo || 'all',
      title: formData.title.trim(),
      message: formData.message.trim()
    };

    try {
      let res;
      try {
        res = await api.post('/api/notifications/custom-push', payload);
      } catch (firstErr) {
        // Fallback to /api/admin/custom-push
        res = await api.post('/api/admin/custom-push', payload);
      }

      if (res.data && (res.data.success || res.status === 200)) {
        const successMsg = res.data.message || 'Custom push notification sent successfully!';
        toast.success(successMsg);
        setFeedback({ 
          type: 'success', 
          text: successMsg + (res.data.count !== undefined ? ` (Dispatched to ${res.data.count} accounts)` : '') 
        });
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
            Push Custom Notification
          </Typography>
          <div className="text-gray-400">
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
              Live Dispatch Engine
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {feedback && (
            <Alert 
              severity={feedback.type} 
              onClose={() => setFeedback(null)}
              icon={feedback.type === 'success' ? <CheckCircleRoundedIcon fontSize="inherit" /> : undefined}
              className="mb-4"
            >
              {feedback.text}
            </Alert>
          )}

          {/* Send To - Select Dropdown */}
          <Box>
            <label className="block text-sm text-gray-500 mb-1 font-medium">Send Target Audience*</label>
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
              <MenuItem value="all">🌐 All Users & Partners (Broadcast)</MenuItem>
              <MenuItem value="customers">👤 All Customers (User App)</MenuItem>
              <MenuItem value="riders">🛵 All Delivery Riders (Rider App)</MenuItem>
              <MenuItem value="restaurants">🍳 All Restaurants (Partner App)</MenuItem>
              <MenuItem value="android">📱 Android Users</MenuItem>
              <MenuItem value="ios">🍏 iOS Users</MenuItem>
            </TextField>
          </Box>

          {/* Title - Input */}
          <Box>
            <label className="block text-sm text-gray-500 mb-1 font-medium">Notification Title*</label>
            <TextField
              fullWidth
              name="title"
              value={formData.title}
              onChange={handleChange}
              variant="outlined"
              size="small"
              placeholder="e.g. Special Weekend Offer 50% Off!"
            />
          </Box>

          {/* Message - Textarea */}
          <Box>
            <label className="block text-sm text-gray-500 mb-1 font-medium">Message Body*</label>
            <TextField
              fullWidth
              name="message"
              value={formData.message}
              onChange={handleChange}
              variant="outlined"
              multiline
              rows={4}
              placeholder="Enter your push notification message that users will see on their lock screen & bell drawer..."
              className="resize-y"
            />
          </Box>

          {/* Action Button */}
          <div className="pt-2 flex items-center gap-4">
            <Button 
              variant="contained" 
              onClick={handleSend}
              disabled={loading}
              className="bg-[#248C70] hover:bg-[#1b6b55] font-semibold tracking-wide capitalize px-6 py-2.5 text-white shadow-sm flex items-center gap-2"
              sx={{ 
                backgroundColor: '#248C70', 
                '&:hover': { backgroundColor: '#1b6b55' },
                borderRadius: '8px',
                fontWeight: 600
              }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <CircularProgress size={18} color="inherit" />
                  <span>DISPATCHING NOTIFICATION...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SendRoundedIcon fontSize="small" />
                  <span>SEND NOTIFICATION</span>
                </div>
              )}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomPushForm;

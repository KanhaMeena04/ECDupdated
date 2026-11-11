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

const APP_OPTIONS = [
  { key: 'customers', label: 'User App (Customers)', short: 'User App' },
  { key: 'restaurants', label: 'Restaurant App (Partners)', short: 'Restaurant App' },
  { key: 'riders', label: 'Rider App (Delivery Partners)', short: 'Rider App' },
];

const CustomPushForm = () => {
  const [formData, setFormData] = useState({
    sendTo: 'customers',
    targetApps: ['customers'],
    title: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleToggleApp = (appKey) => {
    if (appKey === 'all') {
      const allKeys = APP_OPTIONS.map((o) => o.key);
      const isAllSelected = allKeys.every((k) => formData.targetApps.includes(k));
      const nextApps = isAllSelected ? ['customers'] : allKeys;
      setFormData((prev) => ({
        ...prev,
        targetApps: nextApps,
        sendTo: nextApps.length === 3 ? 'all' : nextApps[0]
      }));
    } else {
      setFormData((prev) => {
        const exists = prev.targetApps.includes(appKey);
        const nextApps = exists
          ? prev.targetApps.filter((k) => k !== appKey)
          : [...prev.targetApps, appKey];
        const safeApps = nextApps.length > 0 ? nextApps : [appKey];
        return {
          ...prev,
          targetApps: safeApps,
          sendTo: safeApps.length === 3 ? 'all' : safeApps[0]
        };
      });
    }
    if (feedback) setFeedback(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sendTo') {
      const nextApps = value === 'all' ? APP_OPTIONS.map((o) => o.key) : [value];
      setFormData((prev) => ({
        ...prev,
        sendTo: value,
        targetApps: nextApps
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
    if (feedback) setFeedback(null);
  };

  const handleSend = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formData.targetApps || formData.targetApps.length === 0) {
      toast.error('Please select at least one target app');
      setFeedback({ type: 'error', text: 'Please select at least one target app' });
      return;
    }

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

    const isAllApps = formData.targetApps.length === 3;
    const payload = {
      sendTo: isAllApps ? 'all' : formData.targetApps[0],
      targetApps: isAllApps ? ['all'] : formData.targetApps,
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

          {/* Send To - Target Apps Selector */}
          <Box>
            <label className="block text-sm text-gray-600 mb-2 font-semibold">
              Select Target App(s)* <span className="text-xs font-normal text-gray-400">(Choose single app, multiple apps, or All 3 Apps)</span>
            </label>
            <div className="flex flex-wrap gap-2.5 mb-3">
              {APP_OPTIONS.map((opt) => {
                const selected = formData.targetApps.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleToggleApp(opt.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition cursor-pointer ${
                      selected
                        ? 'bg-[#248C70] text-white border-[#248C70] shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {selected ? '✓ ' : ''}{opt.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => handleToggleApp('all')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition cursor-pointer ${
                  formData.targetApps.length === 3
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {formData.targetApps.length === 3 ? '✓ ' : ''}All 3 Apps (User + Restaurant + Rider)
              </button>
            </div>
            <TextField
              select
              fullWidth
              name="sendTo"
              value={formData.targetApps.length === 3 ? 'all' : (formData.targetApps.length === 1 ? formData.targetApps[0] : formData.sendTo)}
              onChange={handleChange}
              variant="outlined"
              size="small"
            >
              <MenuItem value="customers">👤 User App Only (All Customers)</MenuItem>
              <MenuItem value="restaurants">🍳 Restaurant App Only (All Partners)</MenuItem>
              <MenuItem value="riders">🛵 Rider App Only (All Delivery Riders)</MenuItem>
              <MenuItem value="all">🌐 All 3 Apps (User + Restaurant + Rider)</MenuItem>
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

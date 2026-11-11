import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel, CircularProgress, Chip
} from '@mui/material';
import { NotificationsActive, Save } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

const TEMPLATE_LABELS = {
  order_accepted: 'Order Accepted by Restaurant',
  order_preparing: 'Food Preparation Started',
  order_ready: 'Food Ready for Pickup / Rider',
  rider_assigned: 'Delivery Partner Assigned',
  out_for_delivery: 'Order Out for Delivery',
  order_delivered: 'Order Delivered Successfully',
  order_cancelled: 'Order Cancelled'
};

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/admin/notification-templates`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.config) setTemplates(res.data.config);
      } catch (err) {
        toast.error('Failed to load notification templates');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleFieldChange = (key, field, value) => {
    setTemplates((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/admin/notification-templates`, templates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Notification templates saved and activated');
    } catch (err) {
      toast.error('Failed to save notification templates');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsActive sx={{ color: '#248C70', fontSize: 30 }} />
            Notification Template Editor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customize dynamic push & in-app templates using placeholders: {'{orderNumber}'}, {'{restaurantName}'}, {'{customerName}'}, {'{riderName}'}.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving} sx={{ bgcolor: '#248C70' }}>
          {saving ? 'Saving...' : 'Save Templates'}
        </Button>
      </Box>

      <Grid container spacing={2.5}>
        {Object.keys(TEMPLATE_LABELS).map((key) => {
          const tpl = templates[key] || { title: '', body: '', enabled: true };
          return (
            <Grid item xs={12} md={6} key={key}>
              <Paper sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {TEMPLATE_LABELS[key]}
                    </Typography>
                    <Chip label={key} size="small" variant="outlined" sx={{ mt: 0.5, fontSize: 11 }} />
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={tpl.enabled !== false}
                        onChange={(e) => handleFieldChange(key, 'enabled', e.target.checked)}
                        color="success"
                      />
                    }
                    label={tpl.enabled !== false ? 'Enabled' : 'Disabled'}
                  />
                </Box>
                <TextField
                  label="Notification Title"
                  fullWidth
                  size="small"
                  sx={{ mb: 1.5 }}
                  value={tpl.title || ''}
                  onChange={(e) => handleFieldChange(key, 'title', e.target.value)}
                />
                <TextField
                  label="Notification Body"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  value={tpl.body || ''}
                  onChange={(e) => handleFieldChange(key, 'body', e.target.value)}
                />
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}


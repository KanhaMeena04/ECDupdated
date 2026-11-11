import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress, Button, Card, CardContent
} from '@mui/material';
import { Extension, Refresh, CheckCircle, ErrorOutline } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/system/integrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data.integrations)) {
        setIntegrations(res.data.integrations);
      }
    } catch (err) {
      toast.error('Failed to check third-party integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Extension sx={{ color: '#248C70', fontSize: 30 }} />
            Integrations & External Providers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live verification of payment gateways, SMS OTP, FCM push notifications, Google Maps, ImageKit, and SMTP credentials.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchIntegrations}>
          Re-Check Status
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress color="success" />
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {integrations.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.key}>
              <Card sx={{ borderRadius: 2.5, height: '100%', border: item.connected ? '1px solid #A7F3D0' : '1px solid #E5E7EB' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Chip label={item.category} size="small" variant="outlined" />
                    <Chip
                      icon={item.connected ? <CheckCircle /> : <ErrorOutline />}
                      label={item.connected ? 'Connected' : item.configured ? 'Configured' : 'Not Configured'}
                      color={item.connected ? 'success' : item.configured ? 'warning' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {item.name}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1.2, bgcolor: '#F9FAFB', borderRadius: 1.5 }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#374151', wordBreak: 'break-all' }}>
                      {item.details || 'No details available'}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}


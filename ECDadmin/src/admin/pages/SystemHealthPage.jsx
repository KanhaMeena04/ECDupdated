import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip, CircularProgress, Card, CardContent, Divider
} from '@mui/material';
import {
  HealthAndSafety, Refresh, Storage, Memory, Speed, WifiTethering, WarningAmber
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/system/health`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.health) setHealth(res.data.health);
    } catch (err) {
      toast.error('Failed to fetch system health telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const timer = setInterval(fetchHealth, 30000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !health) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  const formatUptime = (sec = 0) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HealthAndSafety sx={{ color: '#248C70', fontSize: 30 }} />
            System Health & Telemetry Monitor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live database connectivity, server memory usage, socket connections, and anomaly counters.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Refresh />} onClick={fetchHealth} sx={{ bgcolor: '#248C70' }}>
          Refresh Now
        </Button>
      </Box>

      {health && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2.5 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">OVERALL STATUS</Typography>
                  <Chip
                    label={health.status}
                    color={health.status === 'HEALTHY' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Uptime: {formatUptime(health.uptimeSeconds)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Node {health.nodeVersion} • Env: {health.environment}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2.5 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Storage fontSize="small" /> DATABASE (MONGODB)
                  </Typography>
                  <Chip
                    label={health.database?.state?.toUpperCase()}
                    color={health.database?.connected ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {health.database?.name || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Host: {health.database?.host || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2.5 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Memory fontSize="small" /> MEMORY & SOCKETS
                  </Typography>
                  <Chip
                    icon={<WifiTethering fontSize="small" />}
                    label={`${health.realtime?.connectedSockets || 0} Sockets`}
                    color="primary"
                    size="small"
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {health.memory?.heapUsedMb} MB / {health.memory?.heapTotalMb} MB Heap
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  RSS: {health.memory?.rssMb} MB • System Free: {health.memory?.systemFreeMb} MB
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed sx={{ color: '#248C70' }} />
                Live Operational Telemetry
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {[
                  { label: 'Total Orders', value: health.metrics?.totalOrders ?? 0, color: '#111827' },
                  { label: 'Active Orders In Flight', value: health.metrics?.activeOrders ?? 0, color: '#2563EB' },
                  { label: 'Online Riders', value: health.metrics?.onlineRiders ?? 0, color: '#059669' },
                  { label: 'Active Online Restaurants', value: health.metrics?.activeRestaurants ?? 0, color: '#059669' },
                  { label: 'Pending Scheduled Changes', value: health.metrics?.pendingScheduledChanges ?? 0, color: '#D97706' },
                  { label: 'Unresolved Recon Mismatches', value: health.metrics?.unresolvedMismatches ?? 0, color: '#DC2626', icon: WarningAmber }
                ].map((m) => (
                  <Grid item xs={6} sm={4} md={2} key={m.label}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: m.color }}>
                        {m.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {m.label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}


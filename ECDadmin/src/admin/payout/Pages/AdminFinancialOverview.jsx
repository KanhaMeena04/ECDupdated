import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import PageHeader from '../../components/PageHeader';
import { API_BASE_URL } from '../../../utils/utils';

const AdminFinancialOverview = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/payment/admin/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token || ''
        }
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data);
      } else {
        setError(data.message || 'Failed to fetch financial summary');
      }
    } catch (err) {
      setError('Error connecting to backend server');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerPayout = async () => {
    setPayoutLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/payment/admin/weekly-payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token || ''
        }
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Weekly payouts processed successfully for restaurants and riders!');
        setPayoutOpen(false);
        fetchSummary();
      } else {
        setError(data.message || 'Weekly payout trigger failed');
      }
    } catch (err) {
      setError('Error triggering payout');
    } finally {
      setPayoutLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <PageHeader
        title="Admin Platform Financial Overview & Weekly Payouts"
        breadcrumbs={[
          { label: "Payouts" },
          { label: "Financial Summary", active: true }
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress color="success" />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUpIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Total Admin Commission</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{summary?.totalCommission?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <StorefrontIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Restaurant Pending Payouts</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{summary?.totalRestaurantPending?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TwoWheelerIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Rider Pending Payouts</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{summary?.totalRiderPending?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Rider Cash in Hand (COD)</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{summary?.totalRiderCashInHand?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              Weekly Automated Payout Trigger
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
              Every Sunday, pending wallet balances for all active restaurants and riders are automatically paid out. You can also trigger the payout process manually below.
            </Typography>

            <Button
              variant="contained"
              color="success"
              size="large"
              sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
              onClick={() => setPayoutOpen(true)}
            >
              Trigger Weekly Payouts Now
            </Button>
          </Paper>
        </>
      )}

      {/* Confirmation Modal */}
      <Dialog open={payoutOpen} onClose={() => setPayoutOpen(false)}>
        <DialogTitle>Confirm Weekly Payout Process</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to trigger weekly bank payouts to all restaurants and riders right now?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayoutOpen(false)} disabled={payoutLoading}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleTriggerPayout} disabled={payoutLoading}>
            {payoutLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Process'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFinancialOverview;

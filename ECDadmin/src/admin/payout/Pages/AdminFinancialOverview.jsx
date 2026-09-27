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
  DialogActions,
  Divider,
  Chip
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import PageHeader from '../../components/PageHeader';
import { API_BASE_URL } from '../../../utils/utils';

const AdminFinancialOverview = () => {
  const [summary, setSummary] = useState(null);
  const [finance, setFinance] = useState(null);
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
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token || ''
      };

      const [summaryRes, financeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/payment/admin/summary`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/finance/dashboard`, { headers })
      ]);

      const summaryData = await summaryRes.json();
      const financeData = await financeRes.json();

      if (summaryData.success) {
        setSummary(summaryData.data || summaryData);
      }
      if (financeData.success) {
        setFinance(financeData.data);
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
      const res = await fetch(`${API_BASE_URL}/api/payment/admin/weekly-payout`, {
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
        title="Admin Platform Financial Overview & Net Platform Revenue"
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
                    <Typography variant="subtitle2">Net Platform Revenue</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{finance?.netPlatformRevenue?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <StorefrontIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Commission Revenue</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{finance?.commissionRevenue?.toFixed(2) || summary?.totalCommissionEarned?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TwoWheelerIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Delivery Margin</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{finance?.deliveryMargin?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Rider COD Cash In Hand</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{summary?.totalCODCollected?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Formula Breakdown Panel */}
          {finance && (
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Net Platform Revenue Formula Breakdown
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                Net Platform Revenue = Commission + Delivery Margin + Customer Fees − Promotional Subsidy − Platform Refunds − Gateway Costs
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary">Commission</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main">+₹{finance.commissionRevenue}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary">Delivery Margin</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main">+₹{finance.deliveryMargin}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary">Customer Fees</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main">+₹{finance.customerFees}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary">Promo Subsidy</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="error.main">-₹{finance.promotionalSubsidy}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary">Platform Refunds</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="error.main">-₹{finance.platformBorneRefunds}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary">Gateway Costs</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="error.main">-₹{finance.gatewayCosts}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

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

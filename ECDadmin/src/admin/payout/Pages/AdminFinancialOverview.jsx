import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import RefreshIcon from '@mui/icons-material/Refresh';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PageHeader from '../../components/PageHeader';
import { API_BASE_URL } from '../../../utils/utils';

const formatCurrency = (val) => {
  const num = Number(val || 0);
  const abs = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return num < 0 ? `-₹${abs}` : `₹${abs}`;
};

const resolveString = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.en && typeof val.en === 'string') return val.en.trim();
    const first = Object.values(val).find(
      (v) => (typeof v === 'string' && v.trim().length > 0) || typeof v === 'number'
    );
    return first !== undefined ? String(first).trim() : '';
  }
  return String(val).trim();
};

const toISODateInput = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const getPresetDates = (preset) => {
  const now = new Date();
  if (preset === 'today') {
    const t = toISODateInput(now);
    return { startDate: t, endDate: t };
  }
  if (preset === '7d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { startDate: toISODateInput(start), endDate: toISODateInput(now) };
  }
  if (preset === '30d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return { startDate: toISODateInput(start), endDate: toISODateInput(now) };
  }
  return { startDate: '', endDate: '' };
};

const PAYOUT_TYPE_LABELS = {
  restaurant_weekly_payout: { label: 'Restaurant Weekly', color: 'primary' },
  rider_weekly_payout: { label: 'Rider Weekly', color: 'secondary' },
  admin_commission_payout: { label: 'Admin Commission', color: 'success' }
};

const AdminFinancialOverview = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [finance, setFinance] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);

  const [periodPreset, setPeriodPreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchDashboardData = useCallback(async (customStart = startDate, customEnd = endDate) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'x-auth-token': token || ''
      };

      const params = new URLSearchParams();
      if (customStart) params.set('startDate', customStart);
      if (customEnd) params.set('endDate', customEnd);
      const financeQuery = params.toString() ? `?${params.toString()}` : '';

      const [summaryRes, financeRes, txRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/payment/admin/summary`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/finance/dashboard${financeQuery}`, { headers }),
        fetch(
          `${API_BASE_URL}/api/payment/admin/transactions?type=restaurant_weekly_payout,rider_weekly_payout,admin_commission_payout&limit=10`,
          { headers }
        )
      ]);

      const [summaryData, financeData, txData] = await Promise.all([
        summaryRes.json(),
        financeRes.json(),
        txRes.json()
      ]);

      if (summaryData.success) {
        setSummary(summaryData.data || summaryData);
      } else {
        setError(summaryData.message || 'Failed to load payment wallet summary');
      }

      if (financeData.success) {
        setFinance(financeData.data);
      } else {
        setError((prev) => prev || financeData.message || 'Failed to load finance metrics');
      }

      if (txData.success) {
        setPayoutHistory(txData.data?.transactions || []);
      }
    } catch (err) {
      setError('Error connecting to backend server');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboardData('', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePresetChange = (preset) => {
    setPeriodPreset(preset);
    if (preset === 'custom') return;
    const { startDate: s, endDate: e } = getPresetDates(preset);
    setStartDate(s);
    setEndDate(e);
    fetchDashboardData(s, e);
  };

  const handleApplyCustomDates = () => {
    fetchDashboardData(startDate, endDate);
  };

  const handleTriggerPayout = async () => {
    setPayoutLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/payment/admin/weekly-payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-auth-token': token || ''
        }
      });
      const data = await res.json();
      if (data.success) {
        const resCount = data.data?.totalRestaurantsPaid ?? data.data?.restaurants?.length ?? 0;
        const riderCount = data.data?.totalRidersPaid ?? data.data?.riders?.length ?? 0;
        const errCount = data.data?.errors?.length ?? 0;
        setSuccess(
          data.message ||
            `Weekly payouts processed: ${resCount} restaurant(s), ${riderCount} rider(s).`
        );
        if (errCount > 0) {
          setError(`${errCount} payout item(s) encountered errors. Please check logs.`);
        }
        setPayoutOpen(false);
        fetchDashboardData(startDate, endDate);
      } else {
        setError(data.message || 'Weekly payout trigger failed');
      }
    } catch (err) {
      setError('Error triggering payout');
    } finally {
      setPayoutLoading(false);
    }
  };

  const totalEligiblePayout = Number(summary?.totalEligiblePayout ?? 0);
  const eligibleRestaurantsCount = Number(summary?.eligibleRestaurantsCount ?? 0);
  const eligibleRidersCount = Number(summary?.eligibleRidersCount ?? 0);
  const pendingRestaurantPayouts = Number(summary?.pendingRestaurantPayouts ?? 0);
  const pendingRiderPayouts = Number(summary?.pendingRiderPayouts ?? 0);
  const liveRiderCodCashInHand = Number(summary?.riderCashInHand ?? 0);

  return (
    <div className="w-full bg-gray-50 min-h-screen p-4 md:p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <PageHeader
          title="Platform Financial Overview & Settlements"
          breadcrumbs={[
            { label: 'Finance' },
            { label: 'Payments & Net Revenue', active: true }
          ]}
        />

        {/* Period Filter Controls */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'custom', label: 'Custom' }
          ].map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              clickable
              color={periodPreset === item.id ? 'success' : 'default'}
              variant={periodPreset === item.id ? 'filled' : 'outlined'}
              onClick={() => handlePresetChange(item.id)}
              size="small"
            />
          ))}

          {periodPreset === 'custom' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
              <TextField
                type="date"
                size="small"
                label="From"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={{ width: 145, bgcolor: 'white' }}
              />
              <TextField
                type="date"
                size="small"
                label="To"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                sx={{ width: 145, bgcolor: 'white' }}
              />
              <Button variant="contained" color="success" size="small" onClick={handleApplyCustomDates}>
                Apply
              </Button>
            </Box>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => fetchDashboardData(startDate, endDate)}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </div>

      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress color="success" />
        </Box>
      ) : (
        <>
          {/* Primary KPI Row */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: '100%',
                  background:
                    (finance?.netPlatformRevenue ?? 0) >= 0
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUpIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ opacity: 0.92 }}>
                      Net Platform Revenue
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(finance?.netPlatformRevenue)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mt: 0.5 }}>
                    Across {finance?.deliveredOrdersCount || 0} delivered order(s)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: '100%',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  color: 'white'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <StorefrontIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ opacity: 0.92 }}>
                      Commission Revenue
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(finance?.commissionRevenue)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mt: 0.5 }}>
                    Delivered GMV: {formatCurrency(finance?.gmv)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: '100%',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  color: 'white'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TwoWheelerIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ opacity: 0.92 }}>
                      Delivery Margin
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(finance?.deliveryMargin)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mt: 0.5 }}>
                    Collected {formatCurrency(finance?.deliveryRevenue)} − Rider {formatCurrency(finance?.riderPayable)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: '100%',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: 'white'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ opacity: 0.92 }}>
                      Live Rider COD Cash In Hand
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(liveRiderCodCashInHand)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mt: 0.5 }}>
                    Lifetime COD: {formatCurrency(summary?.totalCODCollected)} • Frozen Riders: {summary?.frozenRidersCount || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Payment Mode GMV & Order Split */}
          {finance && (
            <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Delivered Order Volume & Payment Mode Split
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip size="small" label={`Total Orders: ${finance.totalOrders}`} />
                  <Chip size="small" color="success" variant="outlined" label={`Delivered: ${finance.deliveredOrdersCount}`} />
                  <Chip size="small" color="error" variant="outlined" label={`Cancelled/Rejected: ${finance.cancelledOrdersCount || 0}`} />
                </Box>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #DBEAFE' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1D4ED8', mb: 0.5 }}>
                      <CreditCardIcon fontSize="small" />
                      <Typography variant="caption" fontWeight="bold">ONLINE GATEWAY GMV</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold">{formatCurrency(finance.onlineGatewayGmv)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Gateway fee ({finance.gatewayFeePercent || 1.8}%) applies only here
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: '#F5F3FF', borderRadius: 2, border: '1px solid #EDE9FE' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6D28D9', mb: 0.5 }}>
                      <PaymentsIcon fontSize="small" />
                      <Typography variant="caption" fontWeight="bold">WALLET GMV</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold">{formatCurrency(finance.walletGmv)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Internal wallet orders (₹0 gateway fee)
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: '#FFFBEB', borderRadius: 2, border: '1px solid #FEF3C7' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#B45309', mb: 0.5 }}>
                      <LocalAtmIcon fontSize="small" />
                      <Typography variant="caption" fontWeight="bold">CASH ON DELIVERY GMV</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold">{formatCurrency(finance.codGmv)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Collected in cash (₹0 gateway fee)
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: '#ECFDF5', borderRadius: 2, border: '1px solid #D1FAE5' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#047857', mb: 0.5 }}>
                      <ReceiptLongIcon fontSize="small" />
                      <Typography variant="caption" fontWeight="bold">TOTAL REFUNDS ISSUED</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold">{formatCurrency(finance.totalRefunds)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Platform loss share: {formatCurrency(finance.platformBorneRefunds)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Formula Breakdown Panel */}
          {finance && (
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                Net Platform Revenue Formula Breakdown
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Net Platform Revenue = Commission + Delivery Margin + Customer Platform Fees − Platform Promo Subsidy − Platform Refunds − Gateway Costs
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, height: '100%' }}>
                    <Typography variant="caption" color="text.secondary">Commission</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                      +{formatCurrency(finance.commissionRevenue)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                      B2B / % margin
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: finance.deliveryMargin >= 0 ? '#f0fdf4' : '#fef2f2',
                      borderRadius: 2,
                      height: '100%'
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">Delivery Margin</Typography>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color={finance.deliveryMargin >= 0 ? 'success.main' : 'error.main'}
                    >
                      {finance.deliveryMargin >= 0 ? `+${formatCurrency(finance.deliveryMargin)}` : formatCurrency(finance.deliveryMargin)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                      Fee − Rider payout
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, height: '100%' }}>
                    <Typography variant="caption" color="text.secondary">Customer Fees</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                      +{formatCurrency(finance.customerFees)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                      Platform fee only
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, height: '100%' }}>
                    <Typography variant="caption" color="text.secondary">Promo Subsidy</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                      -{formatCurrency(finance.promotionalSubsidy)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                      Platform coupon share
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, height: '100%' }}>
                    <Typography variant="caption" color="text.secondary">Platform Refunds</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                      -{formatCurrency(finance.platformBorneRefunds)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                      Platform loss share
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, height: '100%' }}>
                    <Typography variant="caption" color="text.secondary">Gateway Costs</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                      -{formatCurrency(finance.gatewayCosts)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                      {finance.gatewayFeePercent || 1.8}% of Online GMV
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Live Partner Wallets & Navigation */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Restaurant Wallets & Settlement
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/restaurant-payout')}
                  >
                    Restaurant Settlement
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Pending Balance</Typography>
                    <Typography variant="h6" fontWeight="bold" color="warning.dark">
                      {formatCurrency(pendingRestaurantPayouts)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Eligible Outlets</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {eligibleRestaurantsCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Lifetime Paid Out</Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {formatCurrency(summary?.restaurantTotalPaidOut)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Rider Wallets & COD Cash
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => navigate('/rider-cash-management')}>
                      COD Cash
                    </Button>
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/driver-payout')}
                    >
                      Rider Settlement
                    </Button>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Pending Earnings</Typography>
                    <Typography variant="h6" fontWeight="bold" color="warning.dark">
                      {formatCurrency(pendingRiderPayouts)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Eligible Riders</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {eligibleRidersCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Lifetime Paid Out</Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {formatCurrency(summary?.riderTotalPaidOut)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          {/* Weekly Automated Payout Control + History */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 2,
                mb: 3
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Weekly Automated Payout Trigger
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Runs automatically every Sunday at 12:00 AM. Eligible batch right now:{' '}
                  <strong>{eligibleRestaurantsCount} restaurant(s)</strong> ({formatCurrency(pendingRestaurantPayouts)}) +{' '}
                  <strong>{eligibleRidersCount} rider(s)</strong> ({formatCurrency(pendingRiderPayouts)}) ={' '}
                  <strong>{formatCurrency(totalEligiblePayout)}</strong>.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/payment-reconciliation')}
                >
                  Reconciliation
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/order-refund')}
                >
                  Refund Ledger
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  disabled={totalEligiblePayout <= 0}
                  sx={{ px: 3, borderRadius: 2, fontWeight: 'bold' }}
                  onClick={() => setPayoutOpen(true)}
                >
                  {totalEligiblePayout > 0
                    ? `Trigger Weekly Payout (${formatCurrency(totalEligiblePayout)})`
                    : 'No Pending Balances (₹0)'}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
              Recent Weekly Payout Transactions
            </Typography>
            {payoutHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No weekly payout transactions recorded yet.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Partner</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Note / Batch</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payoutHistory.map((tx) => {
                      const meta = PAYOUT_TYPE_LABELS[tx.type] || { label: tx.type, color: 'default' };
                      const partnerName =
                        resolveString(tx.restaurant?.name) ||
                        resolveString(tx.rider?.fullName) ||
                        resolveString(tx.rider?.name) ||
                        resolveString(tx.rider?.user?.name) ||
                        (tx.type === 'admin_commission_payout' ? 'Platform Admin' : 'Partner');
                      return (
                        <TableRow key={tx._id} hover>
                          <TableCell>
                            <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />
                          </TableCell>
                          <TableCell>{partnerName}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {tx.note || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}

      {/* Confirmation Modal */}
      <Dialog open={payoutOpen} onClose={() => !payoutLoading && setPayoutOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Weekly Payout Batch</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will disburse all pending wallet balances, sync settlement ledgers to PAID, and create payout transaction logs:
          </Typography>
          <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 2, border: '1px solid #E5E7EB' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Restaurants ({eligibleRestaurantsCount})</Typography>
              <Typography variant="body2" fontWeight="bold">{formatCurrency(pendingRestaurantPayouts)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Riders ({eligibleRidersCount})</Typography>
              <Typography variant="body2" fontWeight="bold">{formatCurrency(pendingRiderPayouts)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" fontWeight="bold">Total Disbursement</Typography>
              <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                {formatCurrency(totalEligiblePayout)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayoutOpen(false)} disabled={payoutLoading}>
            Cancel
          </Button>
          <Button variant="contained" color="success" onClick={handleTriggerPayout} disabled={payoutLoading}>
            {payoutLoading ? <CircularProgress size={22} color="inherit" /> : 'Confirm & Disburse'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminFinancialOverview;

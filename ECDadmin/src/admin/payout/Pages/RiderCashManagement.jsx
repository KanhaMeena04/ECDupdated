import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PaymentsIcon from '@mui/icons-material/Payments';
import SettingsIcon from '@mui/icons-material/Settings';
import PageHeader from '../../components/PageHeader';
import { API_BASE_URL } from '../../../utils/utils';

const RiderCashManagement = () => {
  const [frozenRiders, setFrozenRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Deposit Dialog State
  const [depositOpen, setDepositOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Cash Limit Dialog State
  const [limitOpen, setLimitOpen] = useState(false);
  const [newLimit, setNewLimit] = useState('');

  useEffect(() => {
    fetchFrozenRiders();
  }, []);

  const fetchFrozenRiders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/payment/rider/frozen-riders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token || ''
        }
      });
      const data = await res.json();
      if (data.success) {
        setFrozenRiders(data.frozenRiders || []);
      } else {
        setError(data.message || 'Failed to fetch frozen riders');
      }
    } catch (err) {
      setError('Error connecting to backend API');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeposit = (rider) => {
    setSelectedRider(rider);
    setDepositAmount(rider.cashInHand ? rider.cashInHand.toString() : '0');
    setDepositOpen(true);
  };

  const handleConfirmDeposit = async () => {
    if (!selectedRider || !depositAmount) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/payment/rider/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          riderId: selectedRider.rider?._id || selectedRider.rider,
          amount: parseFloat(depositAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Cash deposit of ₹${depositAmount} confirmed! Account unfrozen.`);
        setDepositOpen(false);
        fetchFrozenRiders();
      } else {
        setError(data.message || 'Deposit failed');
      }
    } catch (err) {
      setError('Error processing deposit');
    }
  };

  const handleOpenLimit = (rider) => {
    setSelectedRider(rider);
    setNewLimit(rider.cashLimit ? rider.cashLimit.toString() : '2000');
    setLimitOpen(true);
  };

  const handleConfirmLimit = async () => {
    if (!selectedRider || !newLimit) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/payment/rider/cash-limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          riderId: selectedRider.rider?._id || selectedRider.rider,
          cashLimit: parseFloat(newLimit)
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Cash limit updated to ₹${newLimit}`);
        setLimitOpen(false);
        fetchFrozenRiders();
      } else {
        setError(data.message || 'Update failed');
      }
    } catch (err) {
      setError('Error updating limit');
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <PageHeader
        title="Rider COD Cash Management & Unfreeze"
        breadcrumbs={[
          { label: "Payouts" },
          { label: "Rider Cash Controls", active: true }
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LockIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="textSecondary">Frozen Riders</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="error">{frozenRiders.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#F3F4F6' }}>
            <TableRow>
              <TableCell fontWeight="bold">Rider</TableCell>
              <TableCell fontWeight="bold">Phone</TableCell>
              <TableCell fontWeight="bold">Cash In Hand (COD)</TableCell>
              <TableCell fontWeight="bold">COD Limit</TableCell>
              <TableCell fontWeight="bold">Status</TableCell>
              <TableCell fontWeight="bold">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center"><CircularProgress size={30} /></TableCell>
              </TableRow>
            ) : frozenRiders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No frozen riders found. All accounts active! 🎉</TableCell>
              </TableRow>
            ) : (
              frozenRiders.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Typography fontWeight="600">{item.rider?.name || 'Rider'}</Typography>
                  </TableCell>
                  <TableCell>{item.rider?.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography color="error.main" fontWeight="bold">
                      ₹{item.cashInHand || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>₹{item.cashLimit || 2000}</TableCell>
                  <TableCell>
                    <Chip label="FROZEN" color="error" size="small" sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<PaymentsIcon />}
                        onClick={() => handleOpenDeposit(item)}
                      >
                        Deposit Cash & Unfreeze
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SettingsIcon />}
                        onClick={() => handleOpenLimit(item)}
                      >
                        Set Limit
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Deposit Modal */}
      <Dialog open={depositOpen} onClose={() => setDepositOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Cash Deposit & Unfreeze</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Rider: <strong>{selectedRider?.rider?.name || 'Rider'}</strong>
          </Typography>
          <TextField
            label="Cash Amount Deposited (₹)"
            type="number"
            fullWidth
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleConfirmDeposit}>
            Confirm Deposit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cash Limit Modal */}
      <Dialog open={limitOpen} onClose={() => setLimitOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set Rider COD Cash Limit</DialogTitle>
        <DialogContent>
          <TextField
            label="New COD Limit (₹)"
            type="number"
            fullWidth
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLimitOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmLimit}>
            Update Limit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RiderCashManagement;

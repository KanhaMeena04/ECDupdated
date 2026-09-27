import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PageHeader from '../../components/PageHeader';
import {
  Button,
  CircularProgress,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { API_BASE_URL } from '../../../utils/utils';
import { toast } from 'react-hot-toast';

function RestaurantPayoutList() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await axios.get(`${API_BASE_URL}/api/settlements/restaurants`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.ledgers) {
        setLedgers(res.data.ledgers);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch settlement ledgers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [statusFilter]);

  const handleUpdateStatus = async (ledgerId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `${API_BASE_URL}/api/settlements/${ledgerId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchSettlements();
        if (selectedLedger && selectedLedger._id === ledgerId) {
          setSelectedLedger({ ...selectedLedger, status: newStatus });
        }
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CALCULATED': return 'default';
      case 'REVIEW': return 'warning';
      case 'APPROVED': return 'info';
      case 'PROCESSING': return 'secondary';
      case 'PAID': return 'success';
      case 'RECONCILED': return 'success';
      case 'PAYMENT_FAILED': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Restaurant Settlement Engine & Payouts"
        breadcrumbs={[
          { label: "Payouts" },
          { label: "Restaurant Settlement Screen", active: true }
        ]}
      />

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Settlement Lifecycle Status</InputLabel>
          <Select value={statusFilter} label="Settlement Lifecycle Status" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="CALCULATED">CALCULATED</MenuItem>
            <MenuItem value="REVIEW">REVIEW</MenuItem>
            <MenuItem value="APPROVED">APPROVED</MenuItem>
            <MenuItem value="PROCESSING">PROCESSING</MenuItem>
            <MenuItem value="PAID">PAID</MenuItem>
            <MenuItem value="RECONCILED">RECONCILED</MenuItem>
            <MenuItem value="PAYMENT_FAILED">PAYMENT_FAILED</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' } }} onClick={fetchSettlements}>
          🔄 Refresh Settlements
        </Button>
      </Box>

      {loading ? (
        <div className="flex justify-center p-8"><CircularProgress style={{ color: '#248C70' }} /></div>
      ) : error ? (
        <Typography color="error" className="p-4">{error}</Typography>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f9fafb' }}>
                <TableRow>
                  <TableCell>Settlement ID</TableCell>
                  <TableCell>Restaurant</TableCell>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Gross Sales</TableCell>
                  <TableCell>Commission</TableCell>
                  <TableCell>Packaging</TableCell>
                  <TableCell>Net Payable</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledgers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: '#6b7280' }}>
                      No settlement ledger lines found for the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgers.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{row.settlementId || row._id.slice(-8).toUpperCase()}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.restaurant?.name || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: '0.825rem' }}>{row.order?.orderNumber || row.order?._id?.slice(-8) || 'N/A'}</TableCell>
                      <TableCell><Chip label={row.orderType || 'delivery'} size="small" variant="outlined" /></TableCell>
                      <TableCell>₹{row.grossSales}</TableCell>
                      <TableCell sx={{ color: '#dc2626' }}>-₹{row.platformCommissionAmount}</TableCell>
                      <TableCell>₹{row.packagingFee || 0}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#059669' }}>₹{row.netPayable}</TableCell>
                      <TableCell><Chip label={row.status} color={getStatusColor(row.status)} size="small" /></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSelectedLedger(row);
                              setBreakdownModalOpen(true);
                            }}
                          >
                            Details
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Breakdown & Status Lifecycle Modal */}
      <Dialog open={breakdownModalOpen} onClose={() => setBreakdownModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Settlement Ledger Breakdown</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedLedger && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="subtitle2">Settlement ID: <strong>{selectedLedger.settlementId}</strong></Typography>
              <Typography variant="body2">Restaurant: <strong>{selectedLedger.restaurant?.name}</strong></Typography>
              <Typography variant="body2">Order Type: <strong>{selectedLedger.orderType}</strong></Typography>
              <hr />
              <Box sx={{ display: 'flex', justifyBetween: 'space-between', bgcolor: '#f9fafb', p: 1.5, borderRadius: 1 }}>
                <span>Gross Food Sales:</span> <strong>₹{selectedLedger.grossSales}</strong>
              </Box>
              <Box sx={{ display: 'flex', justifyBetween: 'space-between', bgcolor: '#f9fafb', p: 1.5, borderRadius: 1 }}>
                <span>Commission ({selectedLedger.platformCommissionPercent}%):</span> <strong style={{ color: '#dc2626' }}>-₹{selectedLedger.platformCommissionAmount}</strong>
              </Box>
              <Box sx={{ display: 'flex', justifyBetween: 'space-between', bgcolor: '#f9fafb', p: 1.5, borderRadius: 1 }}>
                <span>Packaging Fee:</span> <strong>+₹{selectedLedger.packagingFee || 0}</strong>
              </Box>
              <Box sx={{ display: 'flex', justifyBetween: 'space-between', bgcolor: '#f9fafb', p: 1.5, borderRadius: 1 }}>
                <span>Coupon Share ({selectedLedger.couponFundingSource}):</span> <strong>-₹{selectedLedger.couponDiscountShare || 0}</strong>
              </Box>
              <Box sx={{ display: 'flex', justifyBetween: 'space-between', bgcolor: '#ecfdf5', p: 1.5, borderRadius: 1 }}>
                <span style={{ fontWeight: 700 }}>Net Restaurant Payable:</span> <strong style={{ color: '#059669', fontSize: '1.1rem' }}>₹{selectedLedger.netPayable}</strong>
              </Box>

              <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 700 }}>Update Lifecycle Status:</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['CALCULATED', 'REVIEW', 'APPROVED', 'PROCESSING', 'PAID', 'RECONCILED', 'PAYMENT_FAILED'].map((st) => (
                  <Button
                    key={st}
                    size="small"
                    variant={selectedLedger.status === st ? 'contained' : 'outlined'}
                    color={st === 'PAID' || st === 'RECONCILED' ? 'success' : st === 'PAYMENT_FAILED' ? 'error' : 'primary'}
                    onClick={() => handleUpdateStatus(selectedLedger._id, st)}
                  >
                    {st}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBreakdownModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default RestaurantPayoutList;
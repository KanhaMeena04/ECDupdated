import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

export default function PaymentReconciliationPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/reconciliations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.records) setRecords(res.data.records);
    } catch (err) {
      toast.error('Failed to load reconciliation reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleResolve = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`${API_BASE_URL}/api/reconciliations/${id}/resolve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Mismatch marked as resolved');
        fetchRecords();
      }
    } catch (err) {
      toast.error('Failed to resolve mismatch');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
            Payment Gateway & Bank Reconciliation Engine
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor mismatches between order amounts, gateway receipts, refunds, and bank payouts.
          </Typography>
        </div>
        <Button variant="contained" sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' } }} onClick={fetchRecords}>
          🔄 Refresh Reconciliation
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Mismatch Type</TableCell>
                <TableCell>Expected Amount</TableCell>
                <TableCell>Received Amount</TableCell>
                <TableCell>Discrepancy</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#10b981', fontWeight: 600 }}>
                    {loading ? 'Performing reconciliation audit...' : '✓ All transactions reconciled perfectly across Payment Gateway ↔ Settlement ↔ Bank. No active mismatches found.'}
                  </TableCell>
                </TableRow>
              ) : (
                records.map((rec) => (
                  <TableRow key={rec._id}>
                    <TableCell sx={{ fontWeight: 600 }}>{rec.orderId?.orderId || rec.orderId?._id || rec.orderId}</TableCell>
                    <TableCell><Chip label={rec.mismatchType} color="error" size="small" /></TableCell>
                    <TableCell>{`₹${rec.expectedAmount}`}</TableCell>
                    <TableCell>{`₹${rec.receivedAmount}`}</TableCell>
                    <TableCell sx={{ color: '#dc2626', fontWeight: 600 }}>{`₹${rec.discrepancyAmount}`}</TableCell>
                    <TableCell><Chip label={rec.status} size="small" /></TableCell>
                    <TableCell>
                      {rec.status === 'UNRESOLVED' && (
                        <Button size="small" variant="outlined" color="success" onClick={() => handleResolve(rec._id)}>
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

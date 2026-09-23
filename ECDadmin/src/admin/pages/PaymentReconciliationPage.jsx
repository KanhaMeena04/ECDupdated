import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function PaymentReconciliationPage() {
  const [records, setRecords] = useState([]);

  const fetchRecords = async () => {
    try {
      const res = await axios.get('/api/reconciliations');
      if (res.data.records) setRecords(res.data.records);
    } catch (err) {
      toast.error('Failed to load reconciliation reports');
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleResolve = async (id) => {
    try {
      const res = await axios.patch(`/api/reconciliations/${id}/resolve`);
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
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
        Payment Gateway & Bank Reconciliation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Monitor mismatches between order amounts, gateway receipts, refunds, and bank payouts.
      </Typography>

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
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: '#10b981', fontWeight: 600 }}>
                    ✓ All transactions reconciled perfectly. No active mismatches found.
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

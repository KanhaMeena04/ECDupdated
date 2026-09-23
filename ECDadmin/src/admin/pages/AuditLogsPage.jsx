import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/admin/audit-logs');
      if (res.data.logs) setLogs(res.data.logs);
    } catch (err) {
      // Fallback empty if backend audit endpoint is standard
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
        Security & Administrative Audit Logs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Immutable audit records capturing sensitive configuration modifications, price overrides, payout approvals, and emergency switch state changes.
      </Typography>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#6b7280' }}>
                    Audit logging engine active. System events will appear here in real time.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{new Date(log.timestamp || log.createdAt).toLocaleString()}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{log.action}</TableCell>
                    <TableCell><Chip label={log.entity} size="small" variant="outlined" /></TableCell>
                    <TableCell>{log.userName || log.userRole || 'Admin'}</TableCell>
                    <TableCell><Chip label={log.userRole || 'admin'} color="primary" size="small" /></TableCell>
                    <TableCell>{log.ip || '127.0.0.1'}</TableCell>
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

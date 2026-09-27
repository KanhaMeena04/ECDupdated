import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (entityFilter) params.entity = entityFilter;
      if (userRoleFilter) params.userRole = userRoleFilter;

      const res = await axios.get(`${API_BASE_URL}/api/admin/audit-logs`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.logs) setLogs(res.data.logs);
      else if (Array.isArray(res.data)) setLogs(res.data);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, userRoleFilter]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
        Security & Administrative Audit Logs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Immutable audit records capturing sensitive configuration modifications, price overrides, payout approvals, and status changes.
      </Typography>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter Entity</InputLabel>
          <Select value={entityFilter} label="Filter Entity" onChange={(e) => setEntityFilter(e.target.value)}>
            <MenuItem value="">All Entities</MenuItem>
            <MenuItem value="Order">Order</MenuItem>
            <MenuItem value="Restaurant">Restaurant</MenuItem>
            <MenuItem value="Rider">Rider</MenuItem>
            <MenuItem value="Settlement">Settlement</MenuItem>
            <MenuItem value="Refund">Refund</MenuItem>
            <MenuItem value="RuleEngine">Rule Engine</MenuItem>
            <MenuItem value="Coupon">Coupon</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter User Role</InputLabel>
          <Select value={userRoleFilter} label="Filter User Role" onChange={(e) => setUserRoleFilter(e.target.value)}>
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="restaurant_owner">Restaurant Owner</MenuItem>
            <MenuItem value="rider">Rider</MenuItem>
            <MenuItem value="customer">Customer</MenuItem>
          </Select>
        </FormControl>
      </Paper>

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
                <TableCell>Changes / Reason</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: '#6b7280' }}>
                    {loading ? 'Loading audit records...' : 'No audit records match the selected filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell sx={{ fontSize: '0.825rem' }}>{new Date(log.timestamp || log.createdAt).toLocaleString()}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{log.action}</TableCell>
                    <TableCell><Chip label={log.entity} size="small" variant="outlined" color="primary" /></TableCell>
                    <TableCell>{log.userName || 'Admin'}</TableCell>
                    <TableCell><Chip label={log.userRole || 'admin'} color="info" size="small" /></TableCell>
                    <TableCell sx={{ fontSize: '0.825rem', maxWidth: 260 }}>
                      {log.reason ? log.reason : log.changes ? `${log.changes.field}: ${JSON.stringify(log.changes.oldValue)} -> ${JSON.stringify(log.changes.newValue)}` : 'N/A'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#6b7280' }}>{log.ipAddress || '127.0.0.1'}</TableCell>
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

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    description: '',
    isEnabled: false,
    environment: 'all',
    targetAudience: 'all'
  });

  const fetchFlags = async () => {
    try {
      const res = await axios.get('/api/feature-flags');
      if (res.data.flags) setFlags(res.data.flags);
    } catch (err) {
      toast.error('Failed to load feature flags');
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await axios.patch(`/api/feature-flags/${id}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchFlags();
      }
    } catch (err) {
      toast.error('Failed to toggle flag');
    }
  };

  const handleCreate = async () => {
    try {
      const res = await axios.post('/api/feature-flags', formData);
      if (res.data.success) {
        toast.success('Feature flag created');
        setOpenModal(false);
        fetchFlags();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating flag');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
          Backend Feature Flags Control
        </Typography>
        <Button variant="contained" sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' } }} onClick={() => setOpenModal(true)}>
          + Add Feature Flag
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell>Feature Key</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Environment</TableCell>
                <TableCell>Audience</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Toggle</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#6b7280' }}>
                    No custom feature flags yet. Click "+ Add Feature Flag" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                flags.map((flag) => (
                  <TableRow key={flag._id}>
                    <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', color: '#1f2937' }}>{flag.key}</TableCell>
                    <TableCell>{flag.description || '-'}</TableCell>
                    <TableCell><Chip label={flag.environment} size="small" variant="outlined" /></TableCell>
                    <TableCell><Chip label={flag.targetAudience} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Chip label={flag.isEnabled ? 'ENABLED' : 'DISABLED'} color={flag.isEnabled ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Switch checked={flag.isEnabled} onChange={() => handleToggle(flag._id)} color="success" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Feature Flag</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Flag Key (e.g. SELF_PICKUP)" fullWidth value={formData.key} onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })} />
          <TextField label="Description" fullWidth multiline rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <FormControl fullWidth>
            <InputLabel>Environment</InputLabel>
            <Select value={formData.environment} label="Environment" onChange={(e) => setFormData({ ...formData, environment: e.target.value })}>
              <MenuItem value="all">All Environments</MenuItem>
              <MenuItem value="development">Development Only</MenuItem>
              <MenuItem value="production">Production Only</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#248C70' }} onClick={handleCreate}>Create Flag</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

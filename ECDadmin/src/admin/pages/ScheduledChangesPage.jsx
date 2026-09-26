import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/utils';

export default function ScheduledChangesPage() {
  const [changes, setChanges] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    targetEntity: 'AdminSetting',
    payloadJson: '{\n  "surgeConfig": {\n    "rainCharge": {\n      "enabled": true,\n      "fee": 20\n    }\n  }\n}',
    scheduledAt: ''
  });

  const fetchChanges = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/scheduled-changes`);
      if (res.data.changes) setChanges(res.data.changes);
    } catch (err) {
      toast.error('Failed to load scheduled changes');
    }
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  const handleCancel = async (id) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/scheduled-changes/${id}/cancel`);
      if (res.data.success) {
        toast.success('Scheduled change cancelled');
        fetchChanges();
      }
    } catch (err) {
      toast.error('Failed to cancel scheduled change');
    }
  };

  const handleCreate = async () => {
    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(formData.payloadJson);
      } catch (e) {
        return toast.error('Invalid JSON payload string');
      }

      const res = await axios.post(`${API_BASE_URL}/api/scheduled-changes`, {
        title: formData.title,
        targetEntity: formData.targetEntity,
        payload: parsedPayload,
        scheduledAt: formData.scheduledAt
      });

      if (res.data.success) {
        toast.success('Scheduled change added successfully');
        setOpenModal(false);
        fetchChanges();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error scheduling change');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
          Scheduled Future Configuration Changes
        </Typography>
        <Button variant="contained" sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' } }} onClick={() => setOpenModal(true)}>
          + Schedule New Change
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Target Entity</TableCell>
                <TableCell>Scheduled Execution Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {changes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#6b7280' }}>
                    No scheduled configuration changes found.
                  </TableCell>
                </TableRow>
              ) : (
                changes.map((change) => (
                  <TableRow key={change._id}>
                    <TableCell sx={{ fontWeight: 600 }}>{change.title}</TableCell>
                    <TableCell><Chip label={change.targetEntity} size="small" variant="outlined" /></TableCell>
                    <TableCell>{new Date(change.scheduledAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={change.status}
                        color={change.status === 'EXECUTED' ? 'success' : change.status === 'PENDING' ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {change.status === 'PENDING' && (
                        <Button size="small" color="error" onClick={() => handleCancel(change._id)}>
                          Cancel
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

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Schedule Future Config Change</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Title / Description" fullWidth value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          <FormControl fullWidth>
            <InputLabel>Target Entity</InputLabel>
            <Select value={formData.targetEntity} label="Target Entity" onChange={(e) => setFormData({ ...formData, targetEntity: e.target.value })}>
              <MenuItem value="AdminSetting">Admin Settings (Pricing/Surge/Commission)</MenuItem>
              <MenuItem value="EmergencyControl">Emergency Controls</MenuItem>
              <MenuItem value="FeatureFlag">Feature Flags</MenuItem>
              <MenuItem value="RiderEarningConfig">Rider Earning Config</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Scheduled Date & Time"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.scheduledAt}
            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
          />
          <TextField
            label="Payload JSON"
            fullWidth
            multiline
            rows={5}
            value={formData.payloadJson}
            onChange={(e) => setFormData({ ...formData, payloadJson: e.target.value })}
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#248C70' }} onClick={handleCreate}>Save Schedule</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

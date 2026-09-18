import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function RuleEnginePage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    conditionField: 'orderValue',
    operator: '>',
    value: '',
    actionType: 'setDeliveryFee',
    actionValue: '',
    priority: 1
  });

  const fetchRules = async () => {
    try {
      const res = await axios.get('/api/rules');
      if (res.data.success) {
        setRules(res.data.rules || []);
      }
    } catch (err) {
      toast.error('Failed to load dynamic rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await axios.patch(`/api/rules/${id}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchRules();
      }
    } catch (err) {
      toast.error('Failed to toggle rule');
    }
  };

  const handleCreate = async () => {
    try {
      const res = await axios.post('/api/rules', formData);
      if (res.data.success) {
        toast.success('Rule created');
        setOpenModal(false);
        fetchRules();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating rule');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
          Smart Rule Engine
        </Typography>
        <Button variant="contained" sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' } }} onClick={() => setOpenModal(true)}>
          + Create Dynamic Rule
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell>Priority</TableCell>
                <TableCell>Rule Name</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Toggle</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#6b7280' }}>
                    No rules configured yet. Click "+ Create Dynamic Rule" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule._id}>
                    <TableCell><Chip label={`P-${rule.priority}`} size="small" /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{rule.name}</TableCell>
                    <TableCell>{`IF ${rule.conditionField} ${rule.operator} ${rule.value}`}</TableCell>
                    <TableCell>{`THEN ${rule.actionType} (${rule.actionValue})`}</TableCell>
                    <TableCell>
                      <Chip label={rule.isActive ? 'Active' : 'Inactive'} color={rule.isActive ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Switch checked={rule.isActive} onChange={() => handleToggle(rule._id)} color="success" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create Business Rule</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Rule Name" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <TextField label="Description" fullWidth multiline rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          
          <FormControl fullWidth>
            <InputLabel>Condition Field</InputLabel>
            <Select value={formData.conditionField} label="Condition Field" onChange={(e) => setFormData({ ...formData, conditionField: e.target.value })}>
              <MenuItem value="orderValue">Order Value (₹)</MenuItem>
              <MenuItem value="rainStatus">Rain Status (ON/OFF)</MenuItem>
              <MenuItem value="restaurantAcceptanceTime">Restaurant Acceptance Time (min)</MenuItem>
              <MenuItem value="cancellationRate">Cancellation Rate (%)</MenuItem>
              <MenuItem value="riderDistance">Rider Distance (km)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Operator</InputLabel>
            <Select value={formData.operator} label="Operator" onChange={(e) => setFormData({ ...formData, operator: e.target.value })}>
              <MenuItem value=">">&gt; Greater Than</MenuItem>

              <MenuItem value=">=">&gt;= Greater Than Or Equal</MenuItem>
              <MenuItem value="<">&lt; Less Than</MenuItem>
              <MenuItem value="<=">&lt;= Less Than Or Equal</MenuItem>
              <MenuItem value="==">== Equal To</MenuItem>
            </Select>
          </FormControl>

          <TextField label="Condition Value" fullWidth value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />

          <FormControl fullWidth>
            <InputLabel>Action Type</InputLabel>
            <Select value={formData.actionType} label="Action Type" onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}>
              <MenuItem value="setDeliveryFee">Set Delivery Fee (₹)</MenuItem>
              <MenuItem value="addDeliveryFee">Add Surcharge (₹)</MenuItem>
              <MenuItem value="triggerAdminAlert">Trigger Admin Alert</MenuItem>
              <MenuItem value="issueRestaurantWarning">Issue Restaurant Warning</MenuItem>
              <MenuItem value="preventAssignment">Prevent Rider Assignment</MenuItem>
            </Select>
          </FormControl>

          <TextField label="Action Value" fullWidth value={formData.actionValue} onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#248C70' }} onClick={handleCreate}>Save Rule</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

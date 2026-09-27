import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Select,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControl,
  InputLabel
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../utils/utils';

const CreateRoleForm = () => {
  const navigate = useNavigate();
  const [roleName, setRoleName] = useState('');
  const [accountType, setAccountType] = useState('Admin');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState(['Dashboard', 'Order']);

  const permissionsList = [
    "Dashboard", "Order", "Restaurant", "City", "Vehicle", 
    "Driver", "Document", "Promocode", "User", "Cuisines", 
    "Category", "Reports", "Settlements", "RuleEngine"
  ];

  const handleTogglePermission = (perm) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName) {
      toast.error('Role name is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/roles`,
        {
          name: roleName,
          accountType,
          description,
          permissions: selectedPermissions
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success('Role created successfully!');
        navigate('/role');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create role');
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Paper className="p-8 rounded-lg shadow-sm max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Create New System Role</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500 font-medium">New Role Name*</label>
                <TextField 
                  placeholder="e.g. Finance Auditor" 
                  size="small" 
                  fullWidth 
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500 font-medium">Description</label>
                <TextField 
                  placeholder="Role responsibilities..." 
                  size="small" 
                  fullWidth 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500 font-medium">Account Type*</label>
                <Select
                  size="small"
                  fullWidth
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Restaurant Admin">Restaurant Admin</MenuItem>
                  <MenuItem value="Rider Manager">Rider Manager</MenuItem>
                  <MenuItem value="Support">Support</MenuItem>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <label className="text-sm text-gray-500 mb-2 block font-medium">Module Permissions*</label>
            <TableContainer component={Paper} variant="outlined" className="max-w-xl">
              <Table size="small">
                <TableHead className="bg-gray-50">
                  <TableRow>
                    <TableCell className="font-bold text-gray-600 uppercase text-xs">Module</TableCell>
                    <TableCell align="center" className="font-bold text-gray-600 uppercase text-xs">Access Permission</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissionsList.map((name) => (
                    <TableRow key={name} className="hover:bg-gray-50">
                      <TableCell className="text-gray-500 text-sm py-2 px-4">{name}</TableCell>
                      <TableCell align="center" className="py-1">
                        <Checkbox 
                          size="small" 
                          checked={selectedPermissions.includes(name)}
                          onChange={() => handleTogglePermission(name)}
                          sx={{ '&.Mui-checked': { color: '#248C70' } }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <div className="mt-6 flex justify-start gap-4">
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1c6d57' } }}
              className="px-10 py-2 capitalize shadow-none"
            >
              Save Role
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/role')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
};

export default CreateRoleForm;
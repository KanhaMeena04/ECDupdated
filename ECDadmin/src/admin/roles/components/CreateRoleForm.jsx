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
  Checkbox
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../utils/utils';

const PERMISSIONS_LIST = [
  { id: "Dashboard", label: "Dashboard & Analytics", category: "Core" },
  { id: "Order", label: "Orders Management & Tracking", category: "Operations" },
  { id: "Restaurant", label: "Restaurants & Menus", category: "Operations" },
  { id: "MenuApprovals", label: "Menu Items Approval", category: "Operations" },
  { id: "Driver", label: "Riders & Fleets", category: "Operations" },
  { id: "User", label: "User Management & Wallets", category: "Customers" },
  { id: "Promocode", label: "Promocodes & Discounts", category: "Marketing" },
  { id: "PushNotifications", label: "Custom Push Notifications", category: "Marketing" },
  { id: "CMSControlTower", label: "User App CMS Control Tower", category: "Marketing" },
  { id: "Category", label: "Food Categories & Subcategories", category: "Content" },
  { id: "Cuisines", label: "Cuisines & Tags", category: "Content" },
  { id: "City", label: "Service Areas & Geo Zones", category: "Content" },
  { id: "Reports", label: "Financial Reports & Overview", category: "Finance" },
  { id: "Settlements", label: "Payouts & Settlements", category: "Finance" },
  { id: "RuleEngine", label: "Roles & Staff Access Control", category: "Administration" },
  { id: "SiteSettings", label: "Site & Platform Settings", category: "Administration" }
];

const CreateRoleForm = () => {
  const navigate = useNavigate();
  const [roleName, setRoleName] = useState('');
  const [accountType, setAccountType] = useState('Admin');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([
    'Dashboard',
    'Order',
    'Restaurant',
    'User'
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleTogglePermission = (permId) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedPermissions(PERMISSIONS_LIST.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/roles`,
        {
          name: roleName.trim(),
          accountType,
          description: description.trim(),
          permissions: selectedPermissions
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );

      if (res.data.success) {
        toast.success('Role created successfully!');
        navigate('/role');
      } else {
        toast.error(res.data?.message || 'Failed to create role');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <Paper className="p-8 rounded-2xl shadow-sm max-w-7xl mx-auto border border-gray-100">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Create New System Role</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600 font-semibold">New Role Name*</label>
                <TextField 
                  placeholder="e.g. Operations Manager" 
                  size="small" 
                  fullWidth 
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600 font-semibold">Description</label>
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
                <label className="text-sm text-gray-600 font-semibold">Account Type*</label>
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
                  <MenuItem value="Custom">Custom</MenuItem>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-3 max-w-2xl">
              <label className="text-sm text-gray-700 font-bold">
                Module Permissions ({selectedPermissions.length} selected)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-[#248C70] hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-xs font-semibold text-gray-500 hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <TableContainer component={Paper} variant="outlined" className="max-w-2xl rounded-xl overflow-hidden border border-gray-200">
              <Table size="small">
                <TableHead className="bg-gray-50">
                  <TableRow>
                    <TableCell className="font-bold text-gray-600 uppercase text-xs">Module</TableCell>
                    <TableCell className="font-bold text-gray-600 uppercase text-xs">Category</TableCell>
                    <TableCell align="center" className="font-bold text-gray-600 uppercase text-xs">Access Permission</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {PERMISSIONS_LIST.map((item) => {
                    const isChecked = selectedPermissions.includes(item.id);
                    return (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="text-gray-800 font-medium text-sm py-2 px-4">
                          {item.label}
                        </TableCell>
                        <TableCell className="text-gray-400 text-xs py-2 px-4">
                          {item.category}
                        </TableCell>
                        <TableCell align="center" className="py-1">
                          <Checkbox 
                            size="small" 
                            checked={isChecked}
                            onChange={() => handleTogglePermission(item.id)}
                            sx={{ '&.Mui-checked': { color: '#248C70' } }} 
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <div className="mt-8 flex justify-start gap-4">
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1c6d57' } }}
              className="px-10 py-2.5 capitalize shadow-none rounded-xl font-bold"
            >
              {submitting ? 'Saving...' : 'Save Role'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/role')}
              className="rounded-xl px-6"
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
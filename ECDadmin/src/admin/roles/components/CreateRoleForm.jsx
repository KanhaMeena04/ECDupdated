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
import { KeyRound, Eye, EyeOff, ShieldCheck, Mail, Phone, Lock } from 'lucide-react';
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

  // Admin login credentials state
  const [createAdminUser, setCreateAdminUser] = useState(true);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminMobile, setAdminMobile] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

    if (createAdminUser) {
      if (!adminEmail.trim() && !adminMobile.trim()) {
        toast.error('Please enter at least an Email address or Mobile number for login');
        return;
      }
      if (!adminPassword.trim() && !adminPin.trim()) {
        toast.error('Please enter a Password or Security PIN for login');
        return;
      }
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
          permissions: selectedPermissions,
          createAdminUser,
          adminName: adminName.trim() || roleName.trim(),
          adminEmail: adminEmail.trim(),
          adminMobile: adminMobile.trim(),
          adminPassword: adminPassword.trim() || adminPin.trim(),
          adminPin: adminPin.trim() || adminPassword.trim()
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );

      if (res.data.success) {
        toast.success(res.data?.message || 'Role and Admin credentials created successfully!');
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
          {/* Section 1: Role Definitions */}
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

          {/* Section 2: Create Admin Login ID & PIN / Password */}
          <div className="mb-8 p-6 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#248C70]/15 flex items-center justify-center text-[#248C70] shrink-0">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    Admin Login ID &amp; PIN / Password Setup
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                      New
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Create login credentials for this role so they can log into the Admin Console via Email OR Mobile Number using their Password / PIN.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
                <input
                  type="checkbox"
                  id="createAdminUserToggle"
                  checked={createAdminUser}
                  onChange={(e) => setCreateAdminUser(e.target.checked)}
                  className="w-4 h-4 accent-[#248C70] rounded cursor-pointer"
                />
                <label htmlFor="createAdminUserToggle" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                  Enable Admin Login Account
                </label>
              </div>
            </div>

            {createAdminUser && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#248C70]" /> Admin Full Name
                  </label>
                  <TextField
                    placeholder={roleName || "e.g. Rahul Sharma"}
                    size="small"
                    fullWidth
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                  <span className="text-[11px] text-gray-400">Display name for this admin account (defaults to Role Name)</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Mail size={14} className="text-[#248C70]" /> Login Email ID*
                  </label>
                  <TextField
                    placeholder="e.g. manager@ecdkart.com"
                    size="small"
                    type="email"
                    fullWidth
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                  <span className="text-[11px] text-gray-400">Can be entered as Login ID on the Admin Login page</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Phone size={14} className="text-[#248C70]" /> Mobile Number (Login ID)*
                  </label>
                  <TextField
                    placeholder="e.g. 9876543210"
                    size="small"
                    fullWidth
                    value={adminMobile}
                    onChange={(e) => setAdminMobile(e.target.value)}
                  />
                  <span className="text-[11px] text-gray-400">10-digit mobile number for mobile/SMS login</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Lock size={14} className="text-[#248C70]" /> Login Password*
                  </label>
                  <div className="relative">
                    <TextField
                      placeholder="••••••••••••"
                      size="small"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="text-[11px] text-gray-400">Main password used for administrator login</span>
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <KeyRound size={14} className="text-[#248C70]" /> Quick Security PIN (Optional 4-6 digits)
                  </label>
                  <TextField
                    placeholder="e.g. 1234"
                    size="small"
                    type="text"
                    fullWidth
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                  />
                  <span className="text-[11px] text-gray-400">Numeric 4-6 digit PIN. The user can also enter this PIN directly in the password field to log in!</span>
                </div>

                <div className="md:col-span-2 mt-1">
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">ℹ️ Note:</span>
                    <span>
                      The user can sign into the Admin Panel using either <strong>{adminEmail || 'Email'}</strong> or <strong>{adminMobile || 'Mobile Number'}</strong> with their <strong>Password / PIN</strong>. Their access will be automatically restricted to the permissions selected below.
                    </span>
                  </div>
                </div>
              </div>
            )}
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
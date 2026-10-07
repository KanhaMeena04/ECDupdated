import React, { useState, useEffect } from 'react';
import { LuPencilLine, LuTrash2, LuPlus } from "react-icons/lu";
import { Search, X, Shield, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../utils/utils';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Button,
  Checkbox,
  Chip
} from '@mui/material';

const PERMISSIONS_LIST = [
  { id: "Dashboard", label: "Dashboard & Analytics" },
  { id: "Order", label: "Orders & Live Tracking" },
  { id: "Restaurant", label: "Restaurants & Menus" },
  { id: "MenuApprovals", label: "Menu Items Approval" },
  { id: "Driver", label: "Riders & Fleets" },
  { id: "User", label: "User Management & Wallets" },
  { id: "Promocode", label: "Promocodes & Discounts" },
  { id: "PushNotifications", label: "Custom Push Notifications" },
  { id: "CMSControlTower", label: "User App CMS Control Tower" },
  { id: "Category", label: "Food Categories & Subcategories" },
  { id: "Cuisines", label: "Cuisines & Tags" },
  { id: "City", label: "Service Areas & Geo Zones" },
  { id: "Reports", label: "Financial Reports & Overview" },
  { id: "Settlements", label: "Payouts & Settlements" },
  { id: "RuleEngine", label: "Roles & Staff Access Control" },
  { id: "SiteSettings", label: "Site & Platform Settings" }
];

const RoleListTable = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    accountType: 'Admin',
    description: '',
    permissions: []
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_BASE_URL}/api/admin/roles`, {
        headers,
        withCredentials: true
      });
      if (res.data.roles) {
        setRoles(res.data.roles);
      }
    } catch (err) {
      toast.error('Failed to load roles from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setEditFormData({
      name: role.name || '',
      accountType: role.accountType || 'Admin',
      description: role.description || '',
      permissions: Array.isArray(role.permissions) ? [...role.permissions] : []
    });
    setEditModalOpen(true);
  };

  const handleToggleEditPermission = (permId) => {
    setEditFormData(prev => {
      const perms = prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: perms };
    });
  };

  const handleSaveEdit = async () => {
    if (!editFormData.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    setSavingEdit(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/roles/${editingRole._id}`,
        editFormData,
        { headers, withCredentials: true }
      );

      if (res.data.success) {
        toast.success('Role updated successfully');
        setEditModalOpen(false);
        fetchRoles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id, roleName) => {
    if (roleName === 'Super Admin') {
      toast.error('Cannot delete primary Super Admin role');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete role "${roleName}"?`)) return;
    try {
      const headers = getAuthHeaders();
      const res = await axios.delete(`${API_BASE_URL}/api/admin/roles/${id}`, {
        headers,
        withCredentials: true
      });
      if (res.data.success) {
        toast.success('Role deleted successfully');
        fetchRoles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.accountType && r.accountType.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full font-sans p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Platform System Roles</h2>
          <p className="text-xs text-gray-500">Manage real administrative roles and granular permission access</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex items-center flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search roles..."
              className="w-full bg-white text-gray-800 placeholder-gray-400 pl-9 pr-8 py-1.5 border border-gray-300 rounded-full text-sm outline-none focus:border-[#248C70] focus:ring-2 focus:ring-[#248C70]/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => navigate('/create-role')}
            className="flex items-center gap-1.5 bg-[#248C70] hover:bg-[#1c6d57] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap"
          >
            <LuPlus size={16} /> Add Role
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[#495057] text-xs uppercase font-bold">
              <th className="py-3 px-4 w-12 border-r border-gray-200 text-center">#</th>
              <th className="py-3 px-4 border-r border-gray-200">Role Name</th>
              <th className="py-3 px-4 border-r border-gray-200">Account Type</th>
              <th className="py-3 px-4 border-r border-gray-200">Description</th>
              <th className="py-3 px-4 border-r border-gray-200 text-center">Permissions</th>
              <th className="py-3 px-4 font-bold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-600">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 font-medium">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#248C70] border-t-transparent mb-2"></div>
                  <div>Loading platform roles...</div>
                </td>
              </tr>
            ) : filteredRoles.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500">
                  <Shield className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <div className="font-semibold text-gray-700">No platform roles found</div>
                  <div className="text-xs text-gray-400 mt-1">Click "Add Role" to create a new role with custom permissions.</div>
                </td>
              </tr>
            ) : (
              filteredRoles.map((role, idx) => (
                <tr key={role._id} className="border-b border-gray-200 hover:bg-gray-50/70 transition">
                  <td className="py-3 px-4 border-r border-gray-200 text-center font-bold text-xs text-gray-400">{idx + 1}</td>
                  <td className="py-3 px-4 border-r border-gray-200 font-bold text-gray-900">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#248C70]"></span>
                      <span>{role.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 border-r border-gray-200 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 font-semibold text-gray-700">
                      {role.accountType || 'Admin'}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-r border-gray-200 text-xs text-gray-600">{role.description || 'System Role'}</td>
                  <td className="py-3 px-4 border-r border-gray-200 text-center">
                    <Chip 
                      size="small" 
                      label={
                        role.permissions?.includes('all') 
                          ? 'Full Access (All)' 
                          : `${role.permissions?.length || 0} Modules`
                      }
                      sx={{ 
                        bgcolor: role.permissions?.includes('all') ? '#dcfce7' : '#f3f4f6', 
                        color: role.permissions?.includes('all') ? '#166534' : '#374151',
                        fontWeight: 'bold',
                        fontSize: '11px'
                      }}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center items-center gap-3">
                      <button 
                        onClick={() => handleOpenEdit(role)} 
                        className="p-1.5 text-gray-500 hover:text-[#248C70] hover:bg-teal-50 rounded-lg transition"
                        title="Edit Role & Permissions"
                      >
                        <LuPencilLine size={16} />
                      </button>

                      {role.name !== 'Super Admin' && (
                        <button 
                          onClick={() => handleDelete(role._id, role.name)} 
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Role"
                        >
                          <LuTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Role Modal */}
      <Dialog 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem', pb: 1 }}>
          Edit Role: {editingRole?.name}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Role Name*</label>
                <TextField
                  size="small"
                  fullWidth
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Account Type*</label>
                <Select
                  size="small"
                  fullWidth
                  value={editFormData.accountType}
                  onChange={(e) => setEditFormData({ ...editFormData, accountType: e.target.value })}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Restaurant Admin">Restaurant Admin</MenuItem>
                  <MenuItem value="Rider Manager">Rider Manager</MenuItem>
                  <MenuItem value="Support">Support</MenuItem>
                  <MenuItem value="Custom">Custom</MenuItem>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
              <TextField
                size="small"
                fullWidth
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Permissions Checkbox Matrix ({editFormData.permissions.length} active)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, permissions: PERMISSIONS_LIST.map(p => p.id) })}
                    className="text-xs font-semibold text-[#248C70] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, permissions: [] })}
                    className="text-xs font-semibold text-gray-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border p-3 rounded-xl bg-gray-50/50">
                {PERMISSIONS_LIST.map((perm) => {
                  const isChecked = editFormData.permissions.includes(perm.id) || editFormData.permissions.includes('all');
                  return (
                    <label 
                      key={perm.id} 
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                        isChecked ? 'bg-teal-50/80 border-teal-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox
                        size="small"
                        checked={isChecked}
                        onChange={() => handleToggleEditPermission(perm.id)}
                        sx={{ p: 0.5, '&.Mui-checked': { color: '#248C70' } }}
                      />
                      <span className="text-xs font-semibold text-gray-800">{perm.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditModalOpen(false)} sx={{ textTransform: 'none', color: '#6b7280' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            disabled={savingEdit}
            variant="contained" 
            sx={{ 
              bgcolor: '#248C70', 
              '&:hover': { bgcolor: '#1c6d57' },
              textTransform: 'none',
              borderRadius: '10px',
              px: 4
            }}
          >
            {savingEdit ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RoleListTable;
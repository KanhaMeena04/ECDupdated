import React, { useState, useEffect } from 'react';
import { LuPencilLine, LuTrash2 } from "react-icons/lu";
import { Search, X } from 'lucide-react';
import { UnfoldMoreOutlined } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../../utils/utils';

const RoleListTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/roles`, {
        headers: { Authorization: `Bearer ${token}` }
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

  const handleDelete = async (id, isSystemDefault) => {
    if (isSystemDefault) {
      toast.error('Cannot delete system default role');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API_BASE_URL}/api/admin/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
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
    (r.accountType && r.accountType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full font-sans p-4 bg-white rounded-md shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4 gap-2">
        <h2 className="text-lg font-bold text-gray-800">Platform System Roles</h2>
        <div className="relative flex items-center w-64">
          <Search size={16} className="absolute left-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search roles..."
            className="w-full bg-white text-gray-800 placeholder-gray-400 pl-9 pr-8 py-1.5 border border-gray-300 rounded-full text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
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
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-200 text-[#495057] text-sm">
              <th className="py-3 px-4 w-12 border-r border-gray-200 text-center font-bold">#</th>
              <th className="py-3 px-4 border-r border-gray-200 font-bold">Role Name</th>
              <th className="py-3 px-4 border-r border-gray-200 font-bold">Account Type</th>
              <th className="py-3 px-4 border-r border-gray-200 font-bold">Description</th>
              <th className="py-3 px-4 font-bold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-600">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">Loading roles...</td>
              </tr>
            ) : filteredRoles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">No roles found</td>
              </tr>
            ) : (
              filteredRoles.map((role, idx) => (
                <tr key={role._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 border-r border-gray-200 text-center font-bold">{idx + 1}</td>
                  <td className="py-3 px-4 border-r border-gray-200 font-semibold text-gray-900">{role.name}</td>
                  <td className="py-3 px-4 border-r border-gray-200">{role.accountType || 'Admin'}</td>
                  <td className="py-3 px-4 border-r border-gray-200">{role.description || 'System Role'}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center items-center gap-4">
                      {!role.isSystemDefault && (
                        <button onClick={() => handleDelete(role._id, role.isSystemDefault)} className="text-gray-600 hover:text-red-600">
                          <LuTrash2 size={18} />
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
    </div>
  );
};

export default RoleListTable;
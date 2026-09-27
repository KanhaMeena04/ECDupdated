import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../utils/utils';

const CreateStaffForm = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    roleId: '',
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/admin/roles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.roles) {
          setRoles(res.data.roles);
        }
      } catch (err) {
        toast.error('Failed to load roles');
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.roleId) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/admin/staff`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Staff user created successfully!');
        navigate('/staff');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create staff member');
    }
  };

  return (
    <div className="bg-gray-50 p-8 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Add Staff Personnel</h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-gray-600 text-sm font-medium">Assigned Role*</label>
            <select 
              name="roleId"
              value={formData.roleId}
              className="border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              onChange={handleChange}
            >
              <option value="">Select Role</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>{r.name} ({r.accountType})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-600 text-sm font-medium">Full Name*</label>
            <input 
              type="text" 
              name="name"
              placeholder="e.g. John Doe"
              value={formData.name}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-600 text-sm font-medium">Email Address*</label>
            <input 
              type="email" 
              name="email"
              placeholder="staff@ecdkart.co.in"
              value={formData.email}
              className="border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-600 text-sm font-medium">Phone Number</label>
            <input 
              type="text" 
              name="phone"
              placeholder="+91 9876543210"
              value={formData.phone}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-gray-600 text-sm font-medium">Password*</label>
            <input 
              type="password" 
              name="password"
              placeholder="••••••••"
              value={formData.password}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2 mt-4 flex gap-3">
            <button 
              type="submit" 
              className="bg-[#00a684] hover:bg-[#008f72] text-white font-bold py-2 px-8 rounded transition-colors"
            >
              Save Staff Member
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/staff')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-6 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStaffForm;
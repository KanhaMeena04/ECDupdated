import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../../utils/utils';

const StaffTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.staff) {
        setStaffData(res.data.staff);
      }
    } catch (err) {
      toast.error('Failed to fetch staff members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API_BASE_URL}/api/admin/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Staff member deleted');
        fetchStaff();
      }
    } catch (err) {
      toast.error('Failed to delete staff member');
    }
  };

  const filteredStaff = staffData.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Admin Staff & Personnel</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Search</label>
            <input 
              type="text" 
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-gray-200 text-gray-600 text-sm bg-gray-50">
                <th className="p-3 font-semibold border-r w-12 text-center">#</th>
                <th className="p-3 font-semibold border-r">Staff Name</th>
                <th className="p-3 font-semibold border-r">Email</th>
                <th className="p-3 font-semibold border-r">Phone</th>
                <th className="p-3 font-semibold border-r">Assigned Role</th>
                <th className="p-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">Loading staff records...</td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">No staff members found</td>
                </tr>
              ) : (
                filteredStaff.map((item, index) => (
                  <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 border-r text-center font-bold">{index + 1}</td>
                    <td className="p-3 border-r font-medium text-gray-900">{item.name}</td>
                    <td className="p-3 border-r">{item.email}</td>
                    <td className="p-3 border-r">{item.phone || 'N/A'}</td>
                    <td className="p-3 border-r font-semibold text-emerald-700">{item.roleName || item.role?.name || 'Admin'}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleDelete(item._id)} className="p-1 border border-gray-300 rounded hover:bg-red-50 text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffTable;
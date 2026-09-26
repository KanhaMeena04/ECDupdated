import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/utils';
import './Users.css';

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  mobile?: string;
  createdAt: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { 
          Authorization: token ? `Bearer ${token}` : '',
          'x-auth-token': token 
        },
        withCredentials: true
      });
      const list = response.data?.users || (Array.isArray(response.data) ? response.data : []);
      setUsers(list);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, {
          headers: { 
            Authorization: token ? `Bearer ${token}` : '',
            'x-auth-token': token 
          },
          withCredentials: true
        });
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('token');
      const targetId = editingUser._id || editingUser.id;
      await axios.put(
        `${API_BASE_URL}/api/admin/users/${targetId}`,
        {
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role
        },
        { 
          headers: { 
            Authorization: token ? `Bearer ${token}` : '',
            'x-auth-token': token 
          },
          withCredentials: true
        }
      );
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading users from database...</div>;

  return (
    <div className="users-page p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">User Management ({users.length})</h1>
      
      <div className="users-table bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-3 text-xs font-bold text-gray-600">ID</th>
              <th className="p-3 text-xs font-bold text-gray-600">Name</th>
              <th className="p-3 text-xs font-bold text-gray-600">Email</th>
              <th className="p-3 text-xs font-bold text-gray-600">Phone</th>
              <th className="p-3 text-xs font-bold text-gray-600">Role</th>
              <th className="p-3 text-xs font-bold text-gray-600">Created At</th>
              <th className="p-3 text-xs font-bold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  No users found in the database.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const uid = user._id || user.id || '';
                return (
                  <tr key={uid} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-xs text-gray-500">{uid ? `#${uid.slice(-6)}` : '—'}</td>
                    <td className="p-3 font-semibold text-gray-900">{user.name}</td>
                    <td className="p-3 text-gray-600">{user.email}</td>
                    <td className="p-3 text-gray-600">{user.mobile || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded font-bold ${user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 flex gap-2">
                      <button 
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded font-medium" 
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </button>
                      <button 
                        className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded font-medium" 
                        onClick={() => handleDelete(uid)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Edit User</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded-lg"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Role</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="rider">Rider</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 bg-gray-100 rounded-lg text-sm" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
import React, { useState } from 'react';

const CreateStaffForm = () => {
  const [activeTab, setActiveTab] = useState('English');
  const [formData, setFormData] = useState({
    role: '',
    userName: '',
    email: 'admin@deliware.app',
    password: '',
    status: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-gray-50 p-8 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        
        {/* Language Tabs */}
        <div className="flex space-x-6 border-b border-gray-100 mb-6">
          {['English', 'Arabic'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-1 flex items-center gap-2 text-sm font-medium transition-colors ${
                activeTab === tab 
                ? 'text-teal-600 border-b-2 border-teal-600' 
                : 'text-gray-400 border-b-2 border-transparent hover:text-gray-600'
              }`}
            >
              <span className="text-xs">🌐</span> {tab}
            </button>
          ))}
        </div>

        {/* Form Fields */}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          
          {/* Role (Left) */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-500 text-sm">Role</label>
            <select 
              name="role"
              className="border border-gray-200 rounded-md p-2 text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
              onChange={handleChange}
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          {/* User Name (Right) */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-500 text-sm">User Name*</label>
            <input 
              type="text" 
              name="userName"
              placeholder="User Name"
              className="border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
              onChange={handleChange}
            />
          </div>

          {/* Email (Left) */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-500 text-sm">Email*</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              className="border border-gray-200 rounded-md p-2 text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
              onChange={handleChange}
            />
          </div>

          {/* Password (Right) */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-500 text-sm">Password</label>
            <input 
              type="password" 
              name="password"
              placeholder="......"
              className="border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
              onChange={handleChange}
            />
          </div>

          {/* Status (Left - Span 1 col) */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-500 text-sm">Status</label>
            <select 
              name="status"
              className="border border-gray-200 rounded-md p-2 text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
              onChange={handleChange}
            >
              <option value="">Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="md:col-span-2 mt-4">
            <button 
              type="submit" 
              className="bg-[#00a684] hover:bg-[#008f72] text-white font-bold py-2 px-8 rounded transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStaffForm;
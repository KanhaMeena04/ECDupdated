import React, { useState } from 'react';
import { useChangePassword } from '../api/auth.js';

const BACKGROUND_IMAGE_URL = "https://img.freepik.com/free-vector/geometric-gradient-futuristic-background_23-2149116406.jpg";

const ChangePasswordForm = () => {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const { changePassword, isLoading, error, success } = useChangePassword();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmNewPassword) {
      alert("New passwords don't match.");
      return;
    }

    if (passwords.oldPassword === passwords.newPassword) {
      alert("New password must be different from the old password.");
      return;
    }

    await changePassword(passwords.oldPassword, passwords.newPassword);
    
    setPasswords({
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900"
	
	 style={{
        backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
      <div className="w-full max-w-md p-8 space-y-6  rounded-lg absolute  bg-gray-900/50 ">
        <h2 className="text-3xl font-bold text-center text-white">Change Password</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          <div>
            <label 
              htmlFor="oldPassword" 
              className="block text-sm font-medium text-gray-300"
            >
              Old Password
            </label>
            <input
              id="oldPassword"
              name="oldPassword"
              type="password"
              required
              value={passwords.oldPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
              placeholder="Enter old password"
            />
          </div>

          <div>
            <label 
              htmlFor="newPassword" 
              className="block text-sm font-medium text-gray-300"
            >
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              value={passwords.newPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label 
              htmlFor="confirmNewPassword" 
              className="block text-sm font-medium text-gray-300"
            >
              Confirm New Password
            </label>
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              required
              value={passwords.confirmNewPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150 ease-in-out"
          >
            {isLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>

        {success && (
          <p className="mt-4 text-center text-sm font-medium text-green-400">
            Password changed successfully!
          </p>
        )}

        {error && (
          <p className="mt-4 text-center text-sm font-medium text-red-400">
            Error: {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordForm;
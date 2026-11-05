import React from 'react';
import { Box, Typography, Avatar, Button } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserDetails } from '../../api/user';
import SideNav from './SideNav';

const UserDetail = () => {
  const params = useParams();
  const navigate = useNavigate();
  const userId = params?.id || params?.userId;

  const { data, loading, error } = useUserDetails(userId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500 text-sm font-medium">Loading user details...</span>
        </div>
      </div>
    );
  }

  if (!userId || userId === 'undefined' || userId === 'null' || (error && !data)) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col gap-4">
        {/* Breadcrumbs / Header */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Typography variant="h6" className="text-gray-800 font-semibold mr-4">
            User Detail
          </Typography>
          <span>🏠</span>
          <span>&gt;</span>
          <span
            className="hover:underline cursor-pointer text-teal-600 font-medium"
            onClick={() => navigate('/user-management')}
          >
            User Management
          </span>
          <span>&gt;</span>
          <span className="text-gray-400">users</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-lg mx-auto my-12 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <PersonOutlineIcon sx={{ fontSize: 36 }} />
          </div>
          <Typography variant="h6" className="text-gray-800 font-bold mb-2">
            User Not Found
          </Typography>
          <Typography variant="body2" className="text-gray-500 mb-6">
            {error || 'The requested user could not be found or an invalid user ID was provided.'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/user-management')}
            sx={{
              backgroundColor: '#0d9488',
              '&:hover': { backgroundColor: '#0f766e' },
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              px: 3,
            }}
          >
            Back to User Management
          </Button>
        </div>
      </div>
    );
  }

  const userData = data || {
    name: "User",
    email: "N/A",
    mobile: "N/A",
    walletBalance: "0",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col gap-4">
      {/* Breadcrumbs / Header */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Typography variant="h6" className="text-gray-800 font-semibold mr-4">
          User Detail
        </Typography>
        <span>🏠</span>
        <span>&gt;</span>
        <span
          className="hover:underline cursor-pointer text-teal-600 font-medium"
          onClick={() => navigate('/user-management')}
        >
          User Management
        </span>
        <span>&gt;</span>
        <span className="text-gray-400">users</span>
      </div>

      <div className="flex flex-row gap-6">
        {/* SideNav with guaranteed effective userId */}
        <SideNav userId={userId} />

        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-8 min-h-[300px]">
          <div className="mb-8">
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'transparent',
                border: '2px solid #e5e7eb',
              }}
            >
              <PersonOutlineIcon sx={{ fontSize: 50, color: '#4b5563' }} />
            </Avatar>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-y-8 max-w-4xl">
            <Box>
              <Typography className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                First Name
              </Typography>
              <Typography className="text-gray-700 text-sm font-semibold">
                {userData.firstName || (userData.name ? userData.name.split(' ')[0] : 'N/A')}
              </Typography>
            </Box>

            <Box>
              <Typography className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                Last Name
              </Typography>
              <Typography className="text-gray-700 text-sm font-semibold">
                {userData.lastName || (userData.name ? userData.name.split(' ').slice(1).join(' ') : 'N/A')}
              </Typography>
            </Box>

            <Box>
              <Typography className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                Full Name
              </Typography>
              <Typography className="text-gray-700 text-sm font-semibold">
                {userData.name || 'User'}
              </Typography>
            </Box>

            <Box>
              <Typography className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                E-mail
              </Typography>
              <Typography className="text-gray-700 text-sm">
                {userData.email || 'N/A'}
              </Typography>
            </Box>

            <Box>
              <Typography className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                Phone
              </Typography>
              <Typography className="text-gray-700 text-sm">
                {userData.mobile || userData.phone || 'N/A'}
              </Typography>
            </Box>

            <Box>
              <Typography className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                Wallet Balance
              </Typography>
              <Typography className="text-gray-700 text-sm font-bold text-emerald-600">
                {userData.wallet || `₹${(Number(userData.walletBalance) || 0).toFixed(2)}`}
              </Typography>
            </Box>

            <Box className="col-span-2">
              <Typography className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                Created At
              </Typography>
              <Typography className="text-gray-700 text-sm">
                {userData.createdAt ? new Date(userData.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true }) : (userData.registeredAt || 'N/A')}
              </Typography>
            </Box>

            {/* Saved Addresses Section */}
            {userData.savedAddresses && userData.savedAddresses.length > 0 && (
              <Box className="col-span-2 mt-4 pt-6 border-t border-gray-100">
                <Typography className="text-gray-800 text-sm font-bold uppercase tracking-wider mb-3">
                  Saved Delivery Addresses ({userData.savedAddresses.length})
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userData.savedAddresses.map((addr, idx) => (
                    <div
                      key={addr._id || idx}
                      className="p-3.5 rounded-lg border border-gray-200 bg-gray-50 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 uppercase">
                          {addr.label || 'Home'}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white uppercase">
                            Default
                          </span>
                        )}
                      </div>
                      {(addr.flatNo || addr.apartment || addr.floor || addr.buildingName) && (
                        <p className="text-xs font-semibold text-gray-800">
                          {[
                            (addr.flatNo || addr.apartment) && `Flat/House: ${addr.flatNo || addr.apartment}`,
                            addr.floor && `Floor: ${addr.floor}`,
                            addr.buildingName && addr.buildingName,
                          ].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-gray-600">
                        {addr.fullAddress || addr.addressLine || 'No address text'}
                      </p>
                      {addr.landmark && (
                        <p className="text-[11px] text-gray-500 italic">
                          Landmark: {addr.landmark}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Box>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;

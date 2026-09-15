import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useParams } from 'react-router-dom';
import { useUserDetails } from '../../api/user';
import SideNav from './SideNav';

const UserDetail = () => {
  const { userId } = useParams(); // ✅ source of truth

  const { data, loading, error } = useUserDetails(userId);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  const userData = data || {
    name: "Latrach Alaeddine",
    email: "**********",
    mobile: "**********",
    walletBalance: "0",
    createdAt: "December 27th 2025, 7:20:21 am",
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
        <span className="hover:underline cursor-pointer">User Management</span>
        <span>&gt;</span>
        <span className="text-gray-400">users</span>
      </div>

      <div className="flex flex-row gap-6">
        {/* ✅ userId now actually passed */}
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
                Username
              </Typography>
              <Typography className="text-gray-700 text-sm">
                {userData.name}
              </Typography>
            </Box>

            <Box>
              <Typography className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                E-mail
              </Typography>
              <Typography className="text-gray-700 text-sm">
                {userData.email}
              </Typography>
            </Box>

            <Box>
              <Typography className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                Phone
              </Typography>
              <Typography className="text-gray-700 text-sm">
                {userData.mobile}
              </Typography>
            </Box>

            <Box>
              <Typography className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                Wallet Balance
              </Typography>
              <Typography className="text-gray-700 text-sm">
                {userData.walletBalance}
              </Typography>
            </Box>

            <Box className="col-span-2">
              <Typography className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                Created At
              </Typography>
              <Typography className="text-gray-700 text-sm">
                {userData.createdAt}
              </Typography>
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;

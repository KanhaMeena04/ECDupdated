import React from 'react';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useNavigate, useLocation } from 'react-router-dom';

function SideNav({ userId }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleProfile = () => {
    navigate(`/user-profile/${userId}`);
  };

  const handleOrders = () => {
    navigate(`/user-orders/${userId}`);
  };

  const isProfileActive = location.pathname.includes('/user-profile');
  const isOrdersActive = location.pathname.includes('/user-orders');

  return (
    <div className="w-64 flex flex-col gap-1">
      <div
        onClick={handleProfile}
        className={`flex items-center gap-3 p-3 rounded shadow-sm cursor-pointer transition-colors ${
          isProfileActive
            ? 'bg-teal-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        <PersonOutlineIcon fontSize="small" />
        <span className="font-medium text-sm">General</span>
      </div>

      <div
        onClick={handleOrders}
        className={`flex items-center gap-3 p-3 rounded shadow-sm cursor-pointer transition-colors ${
          isOrdersActive
            ? 'bg-teal-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        <ShoppingBagOutlinedIcon fontSize="small" />
        <span className="font-medium text-sm">Orders</span>
      </div>
    </div>
  );
}

export default SideNav;

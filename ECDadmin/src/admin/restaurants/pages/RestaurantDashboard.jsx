import React from 'react';
import { useParams } from 'react-router-dom';
import { 
  Person, 
  Check, 
  StarBorder, 
  OutlinedFlag, 
  PhoneOutlined,
  EmailOutlined,
  Storefront,
  AccessTime,
  Percent,
  LocalShipping
} from '@mui/icons-material';
import { CircularProgress, Box, Typography } from '@mui/material';
import { useEditRestaurantProfile } from '../../api/restaurant';
import PageHeader from '../../components/PageHeader';

const RestaurantDashboard = () => {
  const { id } = useParams();
  const { data: restaurant, loading, error } = useEditRestaurantProfile(id);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#ed2026' }} />
      </Box>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        {error ? `Error: ${error}` : 'Please select a valid restaurant to view dashboard.'}
      </div>
    );
  }

  const rName = typeof restaurant.name === 'object'
    ? (restaurant.name?.en || Object.values(restaurant.name)[0] || 'Restaurant')
    : (restaurant.name || 'Restaurant');

  const details = [
    { label: 'Restaurant Name', icon: <Storefront fontSize="small" />, value: rName },
    { label: 'Email', icon: <EmailOutlined fontSize="small" />, value: restaurant.email || restaurant.owner?.email || '—' },
    { label: 'City', icon: <StarBorder fontSize="small" />, value: restaurant.city || '—' },
    { label: 'Area / Address', icon: <OutlinedFlag fontSize="small" />, value: restaurant.address || restaurant.area || '—' },
    { label: 'Phone Number', icon: <PhoneOutlined fontSize="small" />, value: restaurant.phone || restaurant.contactNumber || restaurant.owner?.mobile || '—' },
  ];

  const commission = [
    { label: 'Admin commission %', icon: <Percent fontSize="small" />, value: `${restaurant.adminCommission || 15}%` },
    { label: 'Packaging Charge', icon: <LocalShipping fontSize="small" />, value: `₹ ${Number(restaurant.packagingCharge || 0).toFixed(2)}` },
    { label: 'Delivery Time', icon: <AccessTime fontSize="small" />, value: restaurant.deliveryTime || '30-40 mins' },
    { label: 'Status', icon: <Check fontSize="small" />, value: restaurant.isActive ? 'Active' : 'Inactive' },
  ];

  const timing = restaurant.timing || {};

  const Row = ({ label, icon, value, isLast }) => (
    <div className={`flex border-gray-100 ${!isLast ? 'border-b' : ''}`}>
      <div className="w-1/3 bg-gray-50 p-3.5 flex items-center gap-2.5 text-gray-700 font-semibold text-xs uppercase tracking-wide">
        <span className="text-red-500">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="w-2/3 p-3.5 text-sm font-medium text-gray-800">
        {value}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <PageHeader
        title={`${rName} Dashboard`}
        breadcrumbs={[
          { label: "Restaurants", href: "/restaurants" },
          { label: rName, active: true },
        ]}
      />

      {/* Top Section: Details and Commission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-4">
        {/* Restaurant Full Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <h2 className="p-4 text-gray-800 font-bold text-base border-b border-gray-100 flex items-center gap-2">
            <Storefront className="text-red-500" fontSize="small" />
            Restaurant Live Details
          </h2>
          <div>
            {details.map((item, index) => (
              <Row key={index} {...item} isLast={index === details.length - 1} />
            ))}
          </div>
        </div>

        {/* Commission Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <h2 className="p-4 text-gray-800 font-bold text-base border-b border-gray-100 flex items-center gap-2">
            <Percent className="text-red-500" fontSize="small" />
            Commission & Operational Terms
          </h2>
          <div>
            {commission.map((item, index) => (
              <Row key={index} {...item} isLast={index === commission.length - 1} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Restaurant Hours */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <h2 className="p-4 text-gray-800 font-bold text-base border-b border-gray-100 flex items-center gap-2">
          <AccessTime className="text-red-500" fontSize="small" />
          Operating Hours Schedule
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
            const daySchedule = timing[day] || { open: '09:00 AM', close: '11:00 PM', isClosed: false };
            return (
              <div key={day} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="font-bold text-xs uppercase text-gray-700 mb-1">{day}</div>
                <div className="text-xs text-gray-500">
                  {daySchedule.isClosed ? (
                    <span className="text-red-500 font-bold">Closed</span>
                  ) : (
                    <span>{daySchedule.open || '09:00 AM'} - {daySchedule.close || '11:00 PM'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
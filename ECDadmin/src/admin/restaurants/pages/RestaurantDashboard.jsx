import React from 'react';
import { 
  Person, 
  Check, 
  StarBorder, 
  OutlinedFlag, 
  PhoneOutlined 
} from '@mui/icons-material';

const RestaurantDashboard = () => {
  // Mock data - replace with your actual state or props
  const data = {
    details: [
      { label: 'Restaurant Name', icon: <Person fontSize="small" />, value: 'Not Available' },
      { label: 'Email', icon: <Check fontSize="small" />, value: 'Not Available' },
      { label: 'City', icon: <StarBorder fontSize="small" />, value: 'Not Available' },
      { label: 'Area', icon: <OutlinedFlag fontSize="small" />, value: 'Not Available' },
      { label: 'Phone Number', icon: <PhoneOutlined fontSize="small" />, value: 'Not Available' },
    ],
    commission: [
      { label: 'Admin commission %', icon: <Person fontSize="small" />, value: 'Not Available' },
      { label: 'Restaurant Delivery Charge', icon: <Check fontSize="small" />, value: 'Not Available' },
    ],
    hours: {
      weekdays: [
        { label: 'Restaurant Opens', icon: <Person fontSize="small" />, value: 'Not Available' },
        { label: 'Restaurant Closes', icon: <Check fontSize="small" />, value: 'Not Available' },
      ],
      weekends: [
        { label: 'Restaurant Opens', icon: <Person fontSize="small" />, value: 'Not Available' },
        { label: 'Restaurant Closes', icon: <Check fontSize="small" />, value: 'Not Available' },
        { label: 'Estimated Delivery Time', icon: <Check fontSize="small" />, value: 'Not Available' },
      ]
    }
  };

  const Row = ({ label, icon, value, isLast }) => (
    <div className={`flex border-gray-200 ${!isLast ? 'border-b' : ''}`}>
      <div className="w-1/3 bg-gray-100 p-3 flex items-center gap-3 text-gray-600 font-medium text-sm">
        {icon}
        <span>{label}:</span>
      </div>
      <div className="w-2/3 p-3 text-sm text-gray-400">
        {value}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-blue-50/30 min-h-screen font-sans">
      {/* Top Section: Details and Commission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Restaurant Full Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <h2 className="p-4 text-gray-700 text-lg">Restaurant Full Details :</h2>
          <div>
            {data.details.map((item, index) => (
              <Row key={index} {...item} isLast={index === data.details.length - 1} />
            ))}
          </div>
        </div>

        {/* Commission Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden h-fit">
          <h2 className="p-4 text-gray-700 text-lg">Commission Details:</h2>
          <div>
            {data.commission.map((item, index) => (
              <Row key={index} {...item} isLast={index === data.commission.length - 1} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Restaurant Hours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <h2 className="p-4 text-gray-700 text-lg border-b border-gray-100">Restaurant Hours</h2>
        
        {/* Weekdays Sub-header */}
        <div className="bg-gray-50 p-3 px-4 text-gray-600 font-medium">
          Restaurant Timing Weekdays
        </div>
        {data.hours.weekdays.map((item, index) => (
          <Row key={`wd-${index}`} {...item} />
        ))}

        {/* Weekends Sub-header */}
        <div className="bg-gray-50 p-3 px-4 text-gray-600 font-medium mt-2 border-t border-gray-100">
          Restaurant Timing Weekends
        </div>
        {data.hours.weekends.map((item, index) => (
          <Row key={`we-${index}`} {...item} isLast={index === data.hours.weekends.length - 1} />
        ))}
      </div>
    </div>
  );
};

export default RestaurantDashboard;
import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Typography, 
  Box 
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const PaymentSetting = () => {
  const [stripeData, setStripeData] = useState({
    apiPk: '***************************',
    apiSk: '***************************',
    version: '***************************'
  });

  const [razorpayData, setRazorpayData] = useState({
    key: '***************************',
    secret: '***************************'
  });

  const handleUpdate = (gateway) => {
    console.log(`Updating ${gateway} settings...`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">
        
        {/* Stripe Configuration Card */}
        <div className="flex-1 bg-white rounded-md border border-[#00a689] shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-white">
            <Typography variant="caption" className="font-bold text-gray-700">Stripe</Typography>
            <CheckCircleIcon className="text-[#00a689]" fontSize="small" />
          </div>
          
          <div className="p-6 space-y-4">
            <InputField 
              label="Stripe API Key PK" 
              value={stripeData.apiPk} 
              onChange={(e) => setStripeData({...stripeData, apiPk: e.target.value})} 
            />
            <InputField 
              label="Stripe API Key SK" 
              value={stripeData.apiSk} 
              onChange={(e) => setStripeData({...stripeData, apiSk: e.target.value})} 
            />
            <InputField 
              label="Stripe Version" 
              value={stripeData.version} 
              onChange={(e) => setStripeData({...stripeData, version: e.target.value})} 
            />
            
            <div className="pt-2">
              <Button 
                variant="contained" 
                onClick={() => handleUpdate('Stripe')}
                className="bg-[#00a689] hover:bg-[#1c6d57] capitalize text-xs px-4 py-1.5 shadow-none"
                sx={{ backgroundColor: '#00a689', '&:hover': { backgroundColor: '#1c6d57' }, textTransform: 'none' }}
              >
                Update Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Razorpay Configuration Card */}
        <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden h-fit">
          <div className="p-3 border-b border-gray-100 bg-white">
            <Typography variant="caption" className="font-bold text-gray-700">Razorpay</Typography>
          </div>
          
          <div className="p-6 space-y-4">
            <InputField 
              label="Razorpay Key" 
              value={razorpayData.key} 
              onChange={(e) => setRazorpayData({...razorpayData, key: e.target.value})} 
            />
            <InputField 
              label="Razorpay Secret" 
              value={razorpayData.secret} 
              onChange={(e) => setRazorpayData({...razorpayData, secret: e.target.value})} 
            />
            
            <div className="pt-2">
              <Button 
                variant="contained" 
                onClick={() => handleUpdate('Razorpay')}
                className="bg-[#4db6ac] hover:bg-[#1c6d57] capitalize text-xs px-4 py-1.5 shadow-none"
                sx={{ backgroundColor: '#4db6ac', '&:hover': { backgroundColor: '#1c6d57' }, textTransform: 'none' }}
              >
                Update Settings
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Reusable input component to match the specific UI style
const InputField = ({ label, value, onChange }) => (
  <div className="grid grid-cols-3 items-center gap-4">
    <Typography variant="caption" className="text-gray-500 whitespace-nowrap">
      {label}
    </Typography>
    <div className="col-span-2">
      <TextField 
        fullWidth 
        size="small" 
        value={value} 
        onChange={onChange}
        variant="outlined"
        InputProps={{
          style: { fontSize: '12px', height: '32px' }
        }}
      />
    </div>
  </div>
);

export default PaymentSetting;
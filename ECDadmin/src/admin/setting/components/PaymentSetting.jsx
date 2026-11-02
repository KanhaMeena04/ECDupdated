import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Typography, 
  Box,
  Switch,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../../../utils/api';

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

  const [codData, setCodData] = useState({
    enabled: true,
    maxAmount: 1000,
    minAmount: 0,
    customMessage: ''
  });

  const [codStatus, setCodStatus] = useState({ msg: '', type: 'success' });
  const [loadingCod, setLoadingCod] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/settings');
        if (res.data) {
          const isEnabled = res.data.isCodEnabled !== false && res.data.codConfig?.enabled !== false;
          const maxVal = res.data.maxCodAmount || res.data.codConfig?.maxAmount || 1000;
          setCodData({
            enabled: isEnabled,
            maxAmount: maxVal,
            minAmount: res.data.minCodAmount || res.data.codConfig?.minAmount || 0,
            customMessage: res.data.codConfig?.customMessage || ''
          });
        }
      } catch (e) {
        console.warn('Failed to load COD settings in payment settings:', e);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdate = async (gateway) => {
    if (gateway === 'COD') {
      try {
        setLoadingCod(true);
        await api.put('/api/pricing/cod-config', {
          enabled: codData.enabled,
          maxAmount: Number(codData.maxAmount),
          minAmount: Number(codData.minAmount),
          customMessage: codData.customMessage,
          reason: 'Admin updated COD limits from Payment Settings'
        });
        setCodStatus({ msg: 'COD settings updated successfully!', type: 'success' });
        setTimeout(() => setCodStatus({ msg: '', type: 'success' }), 4000);
      } catch (err) {
        setCodStatus({ msg: err.response?.data?.message || 'Failed to update COD settings', type: 'error' });
      } finally {
        setLoadingCod(false);
      }
      return;
    }
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

        {/* Cash on Delivery (COD) Dynamic Configuration Card */}
        <div className="flex-1 bg-white rounded-md border border-[#248C70] shadow-sm overflow-hidden h-fit">
          <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-white">
            <Typography variant="caption" className="font-bold text-gray-700">Cash on Delivery (COD) Limit</Typography>
            <CheckCircleIcon className="text-[#248C70]" fontSize="small" />
          </div>
          
          <div className="p-6 space-y-4">
            {codStatus.msg && (
              <Alert severity={codStatus.type} sx={{ py: 0, px: 1, fontSize: '12px' }}>
                {codStatus.msg}
              </Alert>
            )}

            <div className="flex justify-between items-center">
              <Typography variant="caption" className="text-gray-500 font-semibold">Enable COD</Typography>
              <Switch 
                checked={codData.enabled}
                onChange={(e) => setCodData({ ...codData, enabled: e.target.checked })}
                color="success"
                size="small"
              />
            </div>

            <InputField 
              label="Max COD Limit (₹)" 
              value={codData.maxAmount} 
              onChange={(e) => setCodData({...codData, maxAmount: e.target.value})} 
            />

            <InputField 
              label="Min COD Limit (₹)" 
              value={codData.minAmount} 
              onChange={(e) => setCodData({...codData, minAmount: e.target.value})} 
            />
            
            <div className="pt-2">
              <Button 
                variant="contained" 
                disabled={loadingCod}
                onClick={() => handleUpdate('COD')}
                className="bg-[#248C70] hover:bg-[#1c6d57] capitalize text-xs px-4 py-1.5 shadow-none"
                sx={{ backgroundColor: '#248C70', '&:hover': { backgroundColor: '#1c6d57' }, textTransform: 'none' }}
              >
                {loadingCod ? 'Saving...' : 'Update COD Settings'}
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
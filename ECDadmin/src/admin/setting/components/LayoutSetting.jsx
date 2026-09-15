import React, { useState } from 'react';
import { 
  Switch, 
  Button, 
  Radio, 
  Typography,
  Tooltip
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

const LayoutSetting = () => {
  const [discovery, setDiscovery] = useState({
    landingPage: false,
    categories: true,
    nearby: true,
    topRated: true,
    popular: true,
    fastest: true,
    brands: true,
    more: true,
  });

  const [layout, setLayout] = useState('standard');

  const toggleSwitch = (key) => {
    setDiscovery(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Top Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
          <div className="absolute top-4 right-4">
            <Button 
              variant="contained" 
              size="small"
              startIcon={<PlayCircleOutlineIcon />}
              className="bg-[#fdf6d2] text-[#856404] hover:bg-[#f9f0c3] capitalize shadow-none border border-[#ffeeba]"
              sx={{ color: '#856404', backgroundColor: '#fdf6d2', '&:hover': { backgroundColor: '#f9f0c3' } }}
            >
              Video Tutorial
            </Button>
          </div>

          <div className="space-y-6">
            {/* Home Page Settings */}
            <section>
              <Typography variant="subtitle2" className="text-gray-500 mb-2">Home Page Settings</Typography>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={discovery.landingPage} 
                  onChange={() => toggleSwitch('landingPage')}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00a689' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00a689' } }}
                />
                <span className="text-sm text-gray-600">Landing Page</span>
              </div>
            </section>

            {/* Discovery Settings */}
            <section className="space-y-2">
              <Typography variant="subtitle2" className="text-gray-500 mb-2">Discovery Settings</Typography>
              {Object.keys(discovery).filter(k => k !== 'landingPage').map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <Switch 
                    checked={discovery[key]} 
                    onChange={() => toggleSwitch(key)}
                    size="small"
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00a689' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00a689' } }}
                  />
                  <span className="text-sm text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* Restaurant Page Settings (Layout Picker) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Typography variant="subtitle2" className="text-gray-500 mb-6">Restaurant Page Settings</Typography>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-20">
            
            {/* Basic Layout Option */}
            <div className="flex flex-col items-center">
              <div className="w-full h-48 bg-gray-100 rounded-md flex items-center justify-center mb-4 relative overflow-hidden">
                {/* Mockup UI representation */}
                <div className="w-32 h-40 bg-white shadow-md border border-gray-200 p-2 space-y-2">
                   <div className="h-10 bg-gray-200 w-full rounded" />
                   <div className="grid grid-cols-2 gap-1">
                      <div className="h-6 bg-gray-100 rounded" />
                      <div className="h-6 bg-gray-100 rounded" />
                      <div className="h-12 bg-gray-50 col-span-2 rounded" />
                   </div>
                </div>
                <Typography variant="caption" className="absolute bottom-2 font-bold text-gray-400">Basic</Typography>
              </div>
              
              <div className="space-y-2 w-full text-center">
                 <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                    <Radio checked={layout === 'basic'} onChange={() => setLayout('basic')} size="small" />
                    <span>Multiple Cards</span>
                 </div>
                 <Typography className="text-[10px] text-gray-400">Recommended Image Size : 480*480</Typography>
                 <Button 
                    fullWidth 
                    variant="contained" 
                    className="bg-[#00a689] hover:bg-[#1c6d57] text-xs py-1.5 capitalize shadow-none rounded"
                    sx={{ backgroundColor: '#00a689' }}
                    onClick={() => setLayout('basic')}
                  >
                    Change
                  </Button>
              </div>
            </div>

            {/* Standard Layout Option */}
            <div className={`flex flex-col items-center p-4 border rounded-md transition-all ${layout === 'standard' ? 'border-[#00a689]' : 'border-transparent'}`}>
              <div className="w-full h-48 bg-gray-100 rounded-md flex items-center justify-center mb-4 relative">
                <div className="w-32 h-40 bg-white shadow-md border border-gray-200 p-2 space-y-2">
                   <div className="h-8 bg-gray-200 w-full rounded" />
                   <div className="h-20 bg-gray-50 w-full rounded" />
                   <div className="h-4 bg-gray-100 w-full rounded" />
                </div>
                <Typography variant="caption" className="absolute bottom-2 font-bold text-gray-400">Standard</Typography>
              </div>

              <div className="space-y-2 w-full text-center">
                 <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                    <Radio checked={layout === 'standard'} onChange={() => setLayout('standard')} size="small" />
                    <span>Single Card</span>
                 </div>
                 <Typography className="text-[10px] text-gray-400">Recommended Image Size : 300*169</Typography>
                 <div className="border border-[#00a689] text-[#00a689] text-[10px] py-1.5 rounded font-medium">
                    Current Layout
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutSetting;
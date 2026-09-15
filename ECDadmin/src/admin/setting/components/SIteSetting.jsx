import React, { useState } from 'react';
import {
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  MenuItem,
  Typography,
  Divider,
} from '@mui/material';

const SiteSetting = () => {
  const [settings, setSettings] = useState({
    appName: 'Deliware',
    metaTitle: 'Deliware - Food Delivery App',
    metaDescription: 'Deliware | Start your Food Delivery business today!',
    iosAppLink: 'https://apps.apple.com/in/app/Deliware-food-delivery/id12113974',
    androidAppLink: 'https://play.google.com/store/apps/details?id=com.deliware.userapp',
    siteEmail: 'info@deliware.app',
    siteContact: '9847192735',
    menuColors: '#2196f3',
    highlightColors: '#2196f3',
    adminCommission: '10',
    restaurantCommission: '20',
    globalGeofenceRadius: '3000',
    defaultUnit: 'MILES',
    orderPrefix: 'DW',
    primaryLanguage: 'English',
    secondaryLanguage: 'Arabic',
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    latitude: '12.9463141',
    longitude: '80.2477201',
    emailEnable: 'Yes',
    smsEnable: 'No',
    codEnable: 'Yes',
    onlinePaymentEnable: 'Yes',
    freeDeliveryEnable: 'Yes',
    isTaxInclusive: 'Yes',
    tipsEnable: 'Yes',
    tips: ['10 %', '20 %', '30 %'],
    timeZone: 'Asia/Calcutta',
    languageEnable: 'Yes',
    currencyPosition: 'Left',
    currencyDecimal: '2',
    currencyDelimiter: ','
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-[1600px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        
        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          
          {/* Row 1: App Name & Meta Title */}
          <InputField label="App Name" name="appName" value={settings.appName} onChange={handleChange} />
          <InputField label="Meta Title" name="metaTitle" value={settings.metaTitle} onChange={handleChange} />

          {/* Row 2: Description & iOS Link */}
          <InputField label="Meta Description" name="metaDescription" value={settings.metaDescription} onChange={handleChange} />
          <InputField label="iOS App Link" name="iosAppLink" value={settings.iosAppLink} onChange={handleChange} />

          {/* Row 3: Android Link & Site Email */}
          <InputField label="Android App Link" name="androidAppLink" value={settings.androidAppLink} onChange={handleChange} />
          <InputField label="Site Email" name="siteEmail" value={settings.siteEmail} onChange={handleChange} />

          {/* File Upload Row */}
          <div className="grid grid-cols-3 gap-4 col-span-2 py-4">
            <FileUploadField label="Site Fav. Icon" />
            <div className="flex flex-col gap-2">
              <FileUploadField label="Site Logo" />
              <img src="https://via.placeholder.com/120x40?text=Deliware" alt="Logo" className="w-32 object-contain" />
            </div>
            <div className="flex flex-col gap-2 items-center">
              <Typography variant="caption" className="text-gray-500 w-full text-left">Qrcode</Typography>
              <div className="p-2 border border-gray-200 rounded">
                 <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Deliware" alt="QR" className="w-20" />
              </div>
            </div>
          </div>

          {/* Contact & Colors */}
          <InputField label="Site Contact" name="siteContact" value={settings.siteContact} onChange={handleChange} />
          <InputField label="Menu Colors" name="menuColors" value={settings.menuColors} onChange={handleChange} />
          <InputField label="Highlight Colors" name="highlightColors" value={settings.highlightColors} onChange={handleChange} />
          <InputField label="Admin Commission" name="adminCommission" value={settings.adminCommission} onChange={handleChange} />

          {/* Commission & Radius */}
          <InputField label="Restaurant Commission" name="restaurantCommission" value={settings.restaurantCommission} onChange={handleChange} />
          <InputField label="Global Geofence Radius (M)" name="globalGeofenceRadius" value={settings.globalGeofenceRadius} onChange={handleChange} />

          {/* Units & Prefixes */}
          <SelectField label="Default Unit" name="defaultUnit" value={settings.defaultUnit} options={['MILES', 'KM']} onChange={handleChange} />
          <InputField label="Order Prefix" name="orderPrefix" value={settings.orderPrefix} onChange={handleChange} />

          {/* Languages */}
          <SelectField label="Primary Language" name="primaryLanguage" value={settings.primaryLanguage} options={['English', 'Spanish']} onChange={handleChange} />
          <SelectField label="Secondary Language" name="secondaryLanguage" value={settings.secondaryLanguage} options={['Arabic', 'French']} onChange={handleChange} />

          {/* Socials */}
          <InputField label="Facebook" name="facebook" value={settings.facebook} onChange={handleChange} />
          <InputField label="Instagram" name="instagram" value={settings.instagram} onChange={handleChange} />

          {/* Scripts / Large Text Areas */}
          <div className="col-span-2 space-y-4">
            <InputField label="Script" multiline rows={2} placeholder="<script>...</script>" />
            <InputField label="Analytics Script" multiline rows={2} placeholder="<script>...</script>" />
            <InputField label="Sharing Script" multiline rows={2} placeholder="<script>...</script>" />
          </div>

          {/* Switches (Radio Groups) */}
          <div className="grid grid-cols-2 gap-8 col-span-2 mt-4">
            <RadioField label="Email Enable" name="emailEnable" value={settings.emailEnable} onChange={handleChange} />
            <RadioField label="SMS Enable" name="smsEnable" value={settings.smsEnable} onChange={handleChange} />
            <RadioField label="COD Enable" name="codEnable" value={settings.codEnable} onChange={handleChange} />
            <RadioField label="Online Payment Enable" name="onlinePaymentEnable" value={settings.onlinePaymentEnable} onChange={handleChange} />
            <RadioField label="Free Delivery Enable" name="freeDeliveryEnable" value={settings.freeDeliveryEnable} onChange={handleChange} />
            <RadioField label="Is Tax Inclusive" name="isTaxInclusive" value={settings.isTaxInclusive} onChange={handleChange} />
          </div>

          {/* Tips Selection */}
          <div className="col-span-2 space-y-2">
            <Typography variant="caption" className="text-gray-500 font-bold">Tips</Typography>
            <div className="flex gap-2">
              {['10 %', '20 %', '30 %'].map(tip => (
                <div key={tip} className="bg-[#00a689] text-white px-3 py-1 rounded text-xs flex items-center gap-2">
                  {tip} <span className="cursor-pointer font-bold">Ã—</span>
                </div>
              ))}
            </div>
          </div>

          {/* Final Row Buttons */}
          <div className="col-span-2 pt-6 flex justify-between">
            <Button 
              variant="contained" 
              className="bg-[#00a689] hover:bg-[#1c6d57] px-8 py-2 capitalize shadow-none"
              sx={{ backgroundColor: '#00a689', '&:hover': { backgroundColor: '#1c6d57' } }}
            >
              Save
            </Button>
            <Button 
              variant="contained" 
              className="bg-[#00a689] hover:bg-[#1c6d57] px-8 py-2 capitalize shadow-none"
              sx={{ backgroundColor: '#00a689', '&:hover': { backgroundColor: '#1c6d57' } }}
            >
              Clear Cache
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components for cleaner code
const InputField = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    <Typography variant="caption" className="text-gray-500 font-semibold">{label}</Typography>
    <TextField fullWidth size="small" variant="outlined" {...props} />
  </div>
);

const SelectField = ({ label, options, ...props }) => (
  <div className="flex flex-col gap-1">
    <Typography variant="caption" className="text-gray-500 font-semibold">{label}</Typography>
    <TextField select fullWidth size="small" variant="outlined" {...props}>
      {options.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
    </TextField>
  </div>
);

const RadioField = ({ label, name, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <Typography variant="caption" className="text-gray-500 font-semibold">{label}</Typography>
    <RadioGroup row name={name} value={value} onChange={onChange}>
      <FormControlLabel value="Yes" control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#00a689' } }} />} label={<span className="text-xs">Yes</span>} />
      <FormControlLabel value="No" control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#00a689' } }} />} label={<span className="text-xs">No</span>} />
    </RadioGroup>
  </div>
);

const FileUploadField = ({ label }) => (
  <div className="flex flex-col gap-1">
    <Typography variant="caption" className="text-gray-500 font-semibold">{label}</Typography>
    <div className="flex border border-gray-300 rounded overflow-hidden">
      <input disabled placeholder="Choose a file or drop it here..." className="flex-grow px-2 py-1 text-xs bg-gray-50" />
      <button className="bg-gray-200 px-3 py-1 text-xs font-bold border-l border-gray-300">Browse</button>
    </div>
  </div>
);

export default SiteSetting;
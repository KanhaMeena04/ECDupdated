import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  MenuItem,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../../utils/utils';

const SiteSetting = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    appName: 'ECDKART Food Delivery',
    metaTitle: 'ECDKART - Instant Food Delivery App',
    metaDescription: 'ECDKART | Order food online from top nearby restaurants',
    iosAppLink: 'https://apps.apple.com/in/app/ecdkart-food-delivery/id12113974',
    androidAppLink: 'https://play.google.com/store/apps/details?id=com.ecdkart.userapp',
    siteEmail: 'info@ecdkart.co.in',
    siteContact: '9847192735',
    menuColors: '#248C70',
    highlightColors: '#248C70',
    adminCommission: '20',
    restaurantCommission: '80',
    globalGeofenceRadius: '3000',
    defaultUnit: 'KM',
    orderPrefix: 'ECD',
    primaryLanguage: 'English',
    secondaryLanguage: 'None',
    facebook: 'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/',
    emailEnable: 'Yes',
    smsEnable: 'No',
    codEnable: 'Yes',
    onlinePaymentEnable: 'Yes',
    freeDeliveryEnable: 'Yes',
    isTaxInclusive: 'Yes'
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
          appName: res.data.appName || 'ECDKART Food Delivery',
          metaTitle: res.data.metaTitle || 'ECDKART - Instant Food Delivery App',
          metaDescription: res.data.metaDescription || 'ECDKART | Order food online from top nearby restaurants',
          androidAppLink: res.data.androidAppLink || 'https://play.google.com/store/apps/details?id=com.ecdkart.userapp',
          siteEmail: res.data.siteEmail || 'info@ecdkart.co.in',
          menuColors: res.data.menuColors || '#248C70',
          highlightColors: res.data.highlightColors || '#248C70'
        }));
      }
    } catch (err) {
      console.warn("Using default ECDKART master settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/api/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        toast.success('Master settings updated successfully in Database!');
      }
    } catch (err) {
      toast.error('Failed to update master settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <CircularProgress color="success" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-[1600px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Master Platform Settings</h2>
        
        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <InputField label="App Name" name="appName" value={settings.appName} onChange={handleChange} />
          <InputField label="Meta Title" name="metaTitle" value={settings.metaTitle} onChange={handleChange} />

          <InputField label="Meta Description" name="metaDescription" value={settings.metaDescription} onChange={handleChange} />
          <InputField label="iOS App Link" name="iosAppLink" value={settings.iosAppLink} onChange={handleChange} />

          <InputField label="Android App Link" name="androidAppLink" value={settings.androidAppLink} onChange={handleChange} />
          <InputField label="Site Email" name="siteEmail" value={settings.siteEmail} onChange={handleChange} />

          <InputField label="Site Contact" name="siteContact" value={settings.siteContact} onChange={handleChange} />
          <InputField label="Menu Colors" name="menuColors" value={settings.menuColors} onChange={handleChange} />
          <InputField label="Highlight Colors" name="highlightColors" value={settings.highlightColors} onChange={handleChange} />
          <InputField label="Admin Commission (%)" name="adminCommission" value={settings.adminCommission} onChange={handleChange} />

          <InputField label="Restaurant Commission (%)" name="restaurantCommission" value={settings.restaurantCommission} onChange={handleChange} />
          <InputField label="Global Geofence Radius (Meters)" name="globalGeofenceRadius" value={settings.globalGeofenceRadius} onChange={handleChange} />

          <SelectField label="Default Unit" name="defaultUnit" value={settings.defaultUnit} options={['KM', 'MILES']} onChange={handleChange} />
          <InputField label="Order Prefix" name="orderPrefix" value={settings.orderPrefix} onChange={handleChange} />

          <InputField label="Facebook Page" name="facebook" value={settings.facebook} onChange={handleChange} />
          <InputField label="Instagram Page" name="instagram" value={settings.instagram} onChange={handleChange} />

          {/* Switches (Radio Groups) */}
          <div className="grid grid-cols-2 gap-8 col-span-2 mt-4">
            <RadioField label="Email Notifications Enable" name="emailEnable" value={settings.emailEnable} onChange={handleChange} />
            <RadioField label="SMS Enable" name="smsEnable" value={settings.smsEnable} onChange={handleChange} />
            <RadioField label="COD Payment Enable" name="codEnable" value={settings.codEnable} onChange={handleChange} />
            <RadioField label="Online Payment Enable" name="onlinePaymentEnable" value={settings.onlinePaymentEnable} onChange={handleChange} />
            <RadioField label="Free Delivery Policy Enable" name="freeDeliveryEnable" value={settings.freeDeliveryEnable} onChange={handleChange} />
            <RadioField label="Is Tax Inclusive" name="isTaxInclusive" value={settings.isTaxInclusive} onChange={handleChange} />
          </div>

          {/* Buttons */}
          <div className="col-span-2 pt-6 flex justify-between">
            <Button 
              variant="contained" 
              disabled={saving}
              onClick={handleSave}
              sx={{ backgroundColor: '#248C70', '&:hover': { backgroundColor: '#1c6d57' }, px: 6, py: 1.5, fontWeight: 700 }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      <FormControlLabel value="Yes" control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#248C70' } }} />} label={<span className="text-xs">Yes</span>} />
      <FormControlLabel value="No" control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#248C70' } }} />} label={<span className="text-xs">No</span>} />
    </RadioGroup>
  </div>
);

export default SiteSetting;
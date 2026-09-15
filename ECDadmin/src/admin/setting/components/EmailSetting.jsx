import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';

const EmailSetting = () => {
  const [activeTab, setActiveTab] = useState('Mail Settings');
  const [formData, setFormData] = useState({
    email: 'admin@deliware.app',
    password: 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢',
    mailDriver: 'smtp',
    mailDebug: '0',
    mailHost: 'smtp-relay.sendinblue.com',
    mailFrom: 'support@deliware.app',
    mailFromName: 'Deliware',
    mailPort: '587',
    mailUsername: 'info@bytesflow.com',
    mailPassword: 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢',
    mailEncryption: 'TLS'
  });

  const sidebarItems = [
    { text: 'New Order Mail', icon: <MailOutlineIcon fontSize="small" /> },
    { text: 'Cancelled Order Mail', icon: <SentimentSatisfiedAltIcon fontSize="small" /> },
    { text: 'Failed Order Mail', icon: <ErrorOutlineIcon fontSize="small" /> },
    { text: 'Restaurant Signup Mail', icon: <StorefrontIcon fontSize="small" /> },
    { text: 'Restaurant Activation Mail', icon: <CheckCircleOutlineIcon fontSize="small" /> },
    { text: 'Driver Signup Mail', icon: <ContactMailIcon fontSize="small" /> },
    { text: 'Driver Activation Mail', icon: <CheckCircleOutlineIcon fontSize="small" /> },
    { text: 'Contact Form', icon: <MailOutlineIcon fontSize="small" /> },
    { text: 'Invoice', icon: <ReceiptIcon fontSize="small" /> },
    { text: 'Wallet OTP Mail', icon: <AccountBalanceWalletIcon fontSize="small" /> },
    { text: 'Mail Settings', icon: <SettingsIcon fontSize="small" /> },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded shadow-sm border border-gray-100 flex min-h-[600px]">
        
        {/* Left Sidebar Navigation */}
        <div className="w-1/4 border-r border-gray-100 py-4">
          <List component="nav">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.text;
              return (
                <ListItem 
                  button 
                  key={item.text}
                  onClick={() => setActiveTab(item.text)}
                  className={`py-2 px-6 transition-colors ${
                    isActive ? 'bg-[#00a689] text-white' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <ListItemIcon className={`min-w-[30px] ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ style: { fontSize: '12px', fontWeight: isActive ? '600' : '400' } }} 
                  />
                </ListItem>
              );
            })}
          </List>
        </div>

        {/* Right Content Form */}
        <div className="w-3/4 p-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            
            <InputField label="Email" name="email" value={formData.email} onChange={handleChange} />
            <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} />
            
            <InputField label="Mail Driver" name="mailDriver" value={formData.mailDriver} onChange={handleChange} />
            <InputField label="Mail Debug" name="mailDebug" value={formData.mailDebug} onChange={handleChange} />
            
            <InputField label="Mail Host" name="mailHost" value={formData.mailHost} onChange={handleChange} />
            <InputField label="Mail From" name="mailFrom" value={formData.mailFrom} onChange={handleChange} />
            
            <InputField label="Mail From Name" name="mailFromName" value={formData.mailFromName} onChange={handleChange} />
            <InputField label="Mail Port" name="mailPort" value={formData.mailPort} onChange={handleChange} />
            
            <InputField label="Mail Username" name="mailUsername" value={formData.mailUsername} onChange={handleChange} />
            <InputField label="Mail Password" name="mailPassword" type="password" value={formData.mailPassword} onChange={handleChange} />
            
            <InputField label="Mail Encryption" name="mailEncryption" value={formData.mailEncryption} onChange={handleChange} />

            <div className="col-span-2 pt-4">
              <Button 
                variant="contained" 
                className="bg-[#00a689] hover:bg-[#1c6d57] capitalize px-6 py-1.5 shadow-none"
                sx={{ backgroundColor: '#00a689', textTransform: 'none', minWidth: '100px' }}
              >
                Save
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// Internal reusable text field
const InputField = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    <Typography variant="caption" className="text-gray-400 font-medium">
      {label}
    </Typography>
    <TextField 
      fullWidth 
      size="small" 
      variant="outlined"
      InputProps={{
        style: { fontSize: '13px', color: '#4b5563' }
      }}
      {...props} 
    />
  </div>
);

export default EmailSetting;
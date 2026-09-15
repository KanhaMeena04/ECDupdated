import * as React from 'react';
import Button from '@mui/material/Button';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


import { API_BASE_URL } from '../../../utils/utils';

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async() => {
try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/logout`);
    
    console.log('User Data:', response.data); 
    
    return response.data;
	navigate('/')

  } catch (error) {
    console.error('Error fetching user data:', error.message);
    
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Error Details:', error.response.data);
    }
    
    throw error; 
  }

   
  };

  return (
    <Button
      variant="contained"
      color="error"
      onClick={handleLogout}
      startIcon={<LogoutRoundedIcon />}
    >
      Logout
    </Button>
  );
}
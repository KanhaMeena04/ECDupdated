import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../../utils/utils';
import toast from 'react-hot-toast';

const useAdminAuth = () => {
  const { login: setAuth, setLoading: setGlobalLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    setGlobalLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      const { user } = res.data;

      if (!user || !user.role) {
        throw new Error("Invalid login response");
      }

      // Persist user (cookie already set by backend)
      setAuth(user);

      toast.success("Login successful");
      setSuccess(true);
      return user;

    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Login failed";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  return { login, loading, error, success };
};



const useChangePassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const changePassword = async (oldPassword, newPassword) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.patch(`${API_BASE_URL}/api/admin/change-password`, {
        oldPassword,
        newPassword
      }, {
        headers: {
          'Authorization': `Bearer YOUR_AUTH_TOKEN`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200 || response.data.success) {
        setSuccess(true);
           navigate('/dashboard');


      } else {
        setError(response.data.message || 'An unknown error occurred.');
      }
      
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || `API Error: ${err.response.status}`);
      } else {
        setError('Network or system error.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { changePassword, isLoading, error, success };
};

export {
   useAdminAuth,
 useChangePassword}

//   register: async (userData) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/auth/register`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(userData),
//       });

//       if (!response.ok) {
//         throw new Error('Registration failed');
//       }

//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Registration error:', error);
//       throw error;
//     }
//   },

//   logout: () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//   },

//   getCurrentUser: () => {
//     const user = localStorage.getItem('user');
//     return user ? JSON.parse(user) : null;
//   },

//   isAuthenticated: () => {
//     return !!localStorage.getItem('token');
//   },

//   getToken: () => {
//     return localStorage.getItem('token');
//   }
// };

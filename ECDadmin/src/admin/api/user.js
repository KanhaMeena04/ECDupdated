import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/utils';
import { useParams } from 'react-router-dom';

/* ================== USERS LIST ================== */
const useUsers = (role = 'customer', page = 1, limit = 10, search = '') => {
  const [data, setData] = useState({ users: [], total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        params: { role, page, limit, search },
        withCredentials: true
      });
      setData(res.data || { users: [], total: 0, page: 1, limit: 10 });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
      setData({ users: [], total: 0, page: 1, limit: 10 });
    } finally {
      setLoading(false);
    }
  }, [role, page, limit, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { data, loading, error, refetch: fetchUsers };
};

/* ================== USER DETAILS ================== */
const useUserDetails = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id: userId } = useParams();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/users/${userId}`, {
          withCredentials: true,
        });
        if (!cancelled) {
          setData(res.data || null);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to fetch user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUser();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { data, loading, error };
};

/* ================== ADD MONEY TO WALLET ================== */
const useAddMoneyToWallet = () => {
  const { id: routeId } = useParams();

  const addMoneyToWallet = async (payloadOrAmount, maybeAmount) => {
    let targetUserId = routeId;
    let targetAmount = maybeAmount;

    if (payloadOrAmount && typeof payloadOrAmount === 'object') {
      targetUserId = payloadOrAmount.userId || payloadOrAmount.id || routeId;
      targetAmount = payloadOrAmount.amount;
    } else if (typeof payloadOrAmount === 'number' || (typeof payloadOrAmount === 'string' && !isNaN(payloadOrAmount))) {
      targetAmount = payloadOrAmount;
    }

    if (!targetUserId) {
      throw new Error("Wallet user id missing");
    }

    const numAmount = Number(targetAmount);
    if (!numAmount || numAmount <= 0) {
      throw new Error("Invalid topup amount");
    }

    try {
      // Primary admin wallet adjust endpoint
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/users/${targetUserId}/wallet-adjust`,
        {
          amount: numAmount,
          type: 'credit',
          note: 'Admin wallet topup',
          transactionId: `ADMIN_${Date.now()}`,
        },
        { withCredentials: true }
      );

      return res.data;
    } catch (error) {
      // Fallback to legacy endpoint if available
      try {
        const fallbackRes = await axios.post(
          `${API_BASE_URL}/api/wallet/add/${targetUserId}`,
          {
            amount: numAmount,
            type: 'credit',
            transactionId: `ADMIN_${Date.now()}`,
          },
          { withCredentials: true }
        );
        return fallbackRes.data;
      } catch (fallbackError) {
        throw error.response?.data || fallbackError.response?.data || error;
      }
    }
  };

  return { addMoneyToWallet };
};

/* ================== WALLET DETAILS ================== */
const useWalletDetails = () => {
  const { id } = useParams();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWalletDetails = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_BASE_URL}/api/wallet/${id}`, {
        withCredentials: true,
      });
      setWallet(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load wallet");
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWalletDetails();
  }, [fetchWalletDetails]);

  return { wallet, loading, error, refetch: fetchWalletDetails };
};

/* ================== COD BLOCK / UNBLOCK ================== */
const useCODBlockUnblock = () => {
  const toggleCodBlock = async (userId, isBlocked) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/users/${userId}/cod`,
        {
          isCodBlocked: !!isBlocked,
          active: !isBlocked,
          block: !!isBlocked
        },
        { withCredentials: true }
      );
      return res.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  return { toggleCodBlock };
};

export {
  useUsers,
  useUserDetails,
  useAddMoneyToWallet,
  useWalletDetails,
  useCODBlockUnblock
};

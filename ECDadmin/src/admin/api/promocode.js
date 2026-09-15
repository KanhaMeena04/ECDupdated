import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../utils/utils.js";

/* =========================
   CREATE PROMOCODE
========================= */
const useCreatePromocode = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const createPromocode = async (promocodeData) => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/promocode`, promocodeData, {
        withCredentials: true,
      });

      toast.success(res.data.message || "Promocode created successfully");
      setSuccess(true);
      return res.data.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to create promocode";
      toast.error(message);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createPromocode, loading, error, success };
};

/* =========================
   LIST PROMOCODES
========================= */
const usePromocodeList = () => {
  const [promocodes, setPromocodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPromocodes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/promocode`, {
        withCredentials: true,
      });
      setPromocodes(res?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch promocodes");
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePromocode = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/promocode/${id}`, { withCredentials: true });
      setPromocodes((prev) => prev.filter((p) => p._id !== id));
      toast.success("Promocode deleted successfully");
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to delete promocode";
      toast.error(message);
      throw new Error(message);
    }
  };

  const updatePromocode = async (id, payload) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/admin/promocode/${id}`, payload, {
        withCredentials: true,
      });

      setPromocodes((prev) =>
        prev.map((promo) => (promo._id === id ? res.data.data : promo))
      );
      toast.success("Promocode updated successfully");
      return res.data.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update promocode";
      toast.error(message);
      throw new Error(message);
    }
  };

  useEffect(() => {
    fetchPromocodes();
  }, [fetchPromocodes]);

  return { promocodes, loading, error, refetch: fetchPromocodes, deletePromocode, updatePromocode };
};

/* =========================
   PROMOCODE DETAILS
========================= */
const usePromocodeDetails = (id) => {
  const [promocode, setPromocode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/promocode/${id}`, {
        withCredentials: true,
      });
      setPromocode(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch promocode");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { promocode, loading, error, refetch: fetchDetails };
};

export { useCreatePromocode, usePromocodeList, usePromocodeDetails };

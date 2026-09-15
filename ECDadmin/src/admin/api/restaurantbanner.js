import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/utils.js';

const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.banners)) return data.banners;
  return [];
};

const useRestaurantBanner = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ================= FETCH ================= */
  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/banner`, {
        withCredentials: true
      });

      setBanners(normalizeArray(response.data));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch banners');
      setBanners([]); // never leave corrupted state
    } finally {
      setLoading(false);
    }
  };

  /* ================= ADD ================= */
  const addBanner = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/banner`,
        payload,
        { withCredentials: true }
      );

      const newBanner = response?.data?.data;
      if (!newBanner) throw new Error('Invalid banner response');

      setBanners((prev) => (Array.isArray(prev) ? [...prev, newBanner] : [newBanner]));
      return newBanner;
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to add banner';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const editBanner = async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/banner/${id}`,
        payload,
        { withCredentials: true }
      );

      const updatedBanner = response?.data?.data;
      if (!updatedBanner) throw new Error('Invalid banner response');

      setBanners((prev) =>
        Array.isArray(prev)
          ? prev.map((banner) => (banner._id === id ? updatedBanner : banner))
          : []
      );

      return updatedBanner;
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to edit banner';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteBanner = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/banner/${id}`, {
        withCredentials: true
      });

      setBanners((prev) =>
        Array.isArray(prev) ? prev.filter((b) => b._id !== id) : []
      );
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to delete banner';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  /* ================= GET BY ID ================= */
const getBannerById = async (id) => {
  if (!id) throw new Error("Banner ID is required");

  setLoading(true);
  setError(null);

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/admin/banner/${id}`,
      { withCredentials: true }
    );

    setBanners(response.data);
    return response.data;
  } catch (err) {
    const message =
      err?.response?.data?.message || err.message || "Failed to fetch banner";
    setError(message);
    throw err;
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchBanners();
  }, []);

  return {
    banners,
    loading,
    error,
    refetch: fetchBanners,
    addBanner,
    editBanner,
    deleteBanner,
    getBannerById
  };
};

export { useRestaurantBanner };

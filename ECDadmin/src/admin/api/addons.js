import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils.js";

const useAddAddons = () => {
  const [formData, setFormData] = useState({
    restaurant: "",
    name: "",
    price: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitAddon = async () => {
    if (!formData.restaurant || !formData.name || !formData.price) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(
        `${API_BASE_URL}/api/admin/addon`,
        {
          restaurant: formData.restaurant,
          name: formData.name,
          price: Number(formData.price),
        },
        { withCredentials: true }
      );

      // Reset after success
      setFormData({
        restaurant: "",
        name: "",
        price: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add addon");
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    handleChange,
    submitAddon,
    loading,
    error,
  };
};

const useAddons = () => {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAddons = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/addon`,
        { withCredentials: true }
      );

      // ✅ EMPTY ARRAY IS VALID — NO ERROR
      const data = res.data?.addons;

      if (Array.isArray(data)) {
        setAddons(data);
      } else {
        // backend sent unexpected shape but request succeeded
        setAddons([]);
      }

    } catch (err) {
      // ❌ ONLY HERE WE SET ERROR
      setError(err.response?.data?.message || "Failed to fetch addons");
      setAddons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  return {
    addons,
    loading,
    error,
    refetch: fetchAddons,
  };
};

const useAddonById = (addonId) => {
  const [addon, setAddon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!addonId) return;

    const fetchAddon = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/admin/addon/${addonId}`,
          { withCredentials: true }
        );

        // ✅ null is acceptable if backend allows it
        setAddon(res.data || null);

      } catch (err) {
        // ❌ ONLY ERROR ON REAL FAILURE
        setError(err.response?.data?.message || "Failed to fetch addon");
        setAddon(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAddon();
  }, [addonId]);

  return { addon, loading, error };
};


 const useEditAddon = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const editAddon = async (addonId, payload) => {
    if (!addonId) throw new Error('Addon ID is required');

    setLoading(true);
    setError('');

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/addon/${addonId}`,
        payload,
        { withCredentials: true }
      );
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to update addon';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { editAddon, loading, error };
};

 const useDeleteAddon = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deleteAddon = async (addonId) => {
    if (!addonId) throw new Error('Addon ID is required');

    setLoading(true);
    setError('');

    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/addon/${addonId}`,
        { withCredentials: true }
      );
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to delete addon';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { deleteAddon, loading, error };
};

export {useAddons,useAddAddons,useDeleteAddon,useEditAddon,useAddonById};

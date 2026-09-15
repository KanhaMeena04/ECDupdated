import { useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

const useCuisine = () => {
  const [cuisines, setCuisines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     FETCH ALL CUISINES
  ========================= */
  const fetchCuisines = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/cuisine`, {
        withCredentials: true,
      });
      setCuisines(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch cuisines");
      setCuisines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================
     ADD CUISINE
  ========================= */
  const addCuisine = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/cuisine`, payload, {
        withCredentials: true,
      });
      // Optionally append to current state
      setCuisines((prev) => [...prev, res.data]);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add cuisine");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UPDATE CUISINE
  ========================= */
  const updateCuisine = async (id, payload) => {
    if (!id) throw new Error("Cuisine ID is required");
    setLoading(true);
    setError("");
    try {
      const res = await axios.put(`${API_BASE_URL}/api/admin/cuisine/${id}`, payload, {
        withCredentials: true,
      });
      setCuisines((prev) => prev.map((c) => (c._id === id ? res.data : c)));
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update cuisine");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DELETE CUISINE
  ========================= */
  const deleteCuisine = async (id) => {
    if (!id) throw new Error("Cuisine ID is required");
    setLoading(true);
    setError("");
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/cuisine/${id}`, {
        withCredentials: true,
      });
      setCuisines((prev) => prev.filter((c) => c._id !== id));
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete cuisine");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    cuisines,
    loading,
    error,
    fetchCuisines,
    addCuisine,
    updateCuisine,
    deleteCuisine,
  };
};

export { useCuisine };

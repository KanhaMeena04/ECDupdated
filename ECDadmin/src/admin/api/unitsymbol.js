// src/api/unitSymbol.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

// Hook for unit CRUD operations
export const useUnitSymbol = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= FETCH ALL UNITS =================
  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/unit`, {
        withCredentials: true,
      });
      setUnits(res.data.unit || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load units");
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= FETCH UNIT DETAILS =================
  const getUnitById = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/unit/${id}`, {
        withCredentials: true,
      });
      return res.data.unit || null;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to fetch unit details");
    }
  };

  // ================= ADD UNIT =================
  const addUnit = async ({ symbol, status }) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/unit`,
        { symbol, status },
        { withCredentials: true }
      );
      setUnits((prev) => [res.data.unit, ...prev]);
      return res.data.unit;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to add unit");
    }
  };

  // ================= UPDATE UNIT =================
  const updateUnit = async (id, payload) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/unit/${id}`,
        payload,
        { withCredentials: true }
      );
      setUnits((prev) => prev.map((u) => (u._id === id ? res.data.unit : u)));
      return res.data.unit;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to update unit");
    }
  };

  // ================= DELETE UNIT =================
  const deleteUnit = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/unit/${id}`, {
        withCredentials: true,
      });
      setUnits((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to delete unit");
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return {
    units,
    loading,
    error,
    fetchUnits,
    getUnitById,
    addUnit,
    updateUnit,
    deleteUnit,
  };
};

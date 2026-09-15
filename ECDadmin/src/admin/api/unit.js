import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

// ================= ADD UNIT =================
const useAddUnit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const addUnit = async ({ symbol, status }) => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await axios.post(
        `${API_BASE_URL}/api/admin/unit`,
        { symbol, status },
        { withCredentials: true }
      );
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add unit");
    } finally {
      setLoading(false);
    }
  };

  return { addUnit, loading, error, success };
};

// ================= UNITS LIST / UPDATE / DELETE =================
const useUnit = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/unit`, {
        withCredentials: true,
      });
      setUnits(res.data.units || []);
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load units");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUnit = async (id, payload) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/unit/${id}`, payload, {
        withCredentials: true,
      });
      fetchUnits();
    } catch (err) {
      throw err;
    }
  };

  const deleteUnit = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/unit/${id}`, {
        withCredentials: true,
      });
      fetchUnits();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return { units, loading, error, updateUnit, deleteUnit, refetch: fetchUnits };
};

// ================= FETCH UNIT DETAILS =================
const useUnitDetails = (id) => {
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUnit = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/unit/${id}`, {
        withCredentials: true,
      });

      // Fix here: if API returns the unit directly
      setUnit(res.data || null); 
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch unit details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUnit();
  }, [fetchUnit]);

  return { unit, loading, error, refetch: fetchUnit };
};


export { useAddUnit, useUnit, useUnitDetails };


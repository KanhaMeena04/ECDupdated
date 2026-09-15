import { useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils.js";

const useVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id of vehicle being modified
  const [error, setError] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/vehicles`, { withCredentials: true });
      setVehicles(Array.isArray(res.data.vehicles) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  }, []);

const addVehicle = async (payload) => {
  console.log("Payload sending to backend:", payload); // now contains base64 strings
  setActionLoading("add");
  setError(null);

  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/admin/vehicles`,
      payload,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }, // send JSON
      }
    );

    setVehicles((prev) => [res.data.vehicle, ...prev]);
    return res.data.vehicle;
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to create vehicle";
    setError(msg);
    throw new Error(msg);
  } finally {
    setActionLoading(null);
  }
};


  const updateVehicle = async (id, payload) => {
    setActionLoading(id);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => v !== undefined && formData.append(k, v));

      const res = await axios.put(`${API_BASE_URL}/api/admin/vehicles/${id}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      setVehicles((prev) => prev.map((v) => (v._id === id ? res.data.vehicle : v)));
      return res.data.vehicle;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update vehicle";
      setError(msg);
      throw new Error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteVehicle = async (id) => {
    setActionLoading(id);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/vehicles/${id}`, { withCredentials: true });
      setVehicles((prev) => prev.filter((v) => v._id !== id));
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete vehicle";
      setError(msg);
      throw new Error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  return {
    vehicles,
    loading,
    actionLoading,
    error,
    fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  };
};

export { useVehicles };

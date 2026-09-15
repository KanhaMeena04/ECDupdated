import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

// ==============================
// Fetch all cities
// ==============================
const useCities = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/cities`, {
        withCredentials: true,
      });
      // normalize response to always be array
      setCities(Array.isArray(data) ? data : data.cities || []);
    } catch (err) {
      console.error("Failed to fetch cities:", err);
      setError(err?.response?.data?.message || "Failed to fetch cities");
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  return { cities, loading, error, refetch: fetchCities };
};

// ==============================
// Add city
// ==============================
const useAddCity = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const addCity = async (payload) => {
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/cities`, payload, {
        withCredentials: true,
      });
      setStatus({ type: "success", msg: res.data.message || "City created" });
      return true;
    } catch (err) {
      const msg = err?.response?.data?.message || "Server error occurred";
      setStatus({ type: "error", msg });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { addCity, loading, status };
};

// ==============================
// Fetch city by ID
// ==============================
const useCityById = (id) => {
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCity = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/cities/${id}`, {
        withCredentials: true,
      });
      setCity(res.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch city");
      setCity(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCity();
  }, [fetchCity]);

  return { city, loading, error, refetch: fetchCity, setCity };
};

export { useCities, useAddCity, useCityById };

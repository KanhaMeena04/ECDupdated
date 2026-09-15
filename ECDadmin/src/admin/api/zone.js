import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

const useZones = (keepPreviousOnError = false) => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchZones = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/zones`, {
        withCredentials: true,
      });
      setZones(Array.isArray(data) ? data : data.zones || []);
    } catch (err) {
      console.error("Failed to fetch zones:", err);
      setError(err?.response?.data?.message || "Failed to fetch zones");
      if (!keepPreviousOnError) setZones([]);
    } finally {
      setLoading(false);
    }
  }, [keepPreviousOnError]);

  useEffect(() => {
    fetchZones(); 
  }, [fetchZones]);

  return { zones, loading, error, refetch: fetchZones };
};

export { useZones };

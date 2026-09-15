import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

function useDashboardData() {
  const [totals, setTotals] = useState({});
  const [heatmap, setHeatmap] = useState([]);
  const [salesSeries, setSalesSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
        withCredentials: true,
      });

      const { totals = {}, heatmap = [], salesSeries = [] } = response.data || {};

      setTotals(totals);
      setHeatmap(Array.isArray(heatmap) ? heatmap : []);
      setSalesSeries(Array.isArray(salesSeries) ? salesSeries : []);
    } catch (err) {
      setTotals({});
      setHeatmap([]);
      setSalesSeries([]);
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { totals, heatmap, salesSeries, loading, error, refetch: fetchDashboard };
}

export { useDashboardData };

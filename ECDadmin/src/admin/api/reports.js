import { useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

export const useReports = () => {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null); // For Profit & Loss
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Generic fetch function for all reports
  const fetchReport = useCallback(
    async (endpoint, params = {}, includeSummary = false) => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/reports/${endpoint}`, {
          params,
          withCredentials: true,
        });

        setReports(res.data.reports || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 0);
        if (includeSummary) setSummary(res.data.summary || null);

        return res.data;
      } catch (err) {
        setError(err.response?.data?.message || `Failed to fetch ${endpoint} report`);
        setReports([]);
        if (includeSummary) setSummary(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Specific report fetchers
  const fetchRestaurantReport = (params) => fetchReport("restaurants", params);
  const fetchRiderReport = (params) => fetchReport("riders", params);
  const fetchOrderReport = (params) => fetchReport("orders", params);
  const fetchTopUsersReport = (params) => fetchReport("top-users", params);
  const fetchWalletReport = (params) => fetchReport("wallet", params);
  const fetchProfitLossReport = (params) => fetchReport("profit-loss", params, true);

  // Export report
  const exportReport = useCallback(
    async (reportType, params = {}) => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/reports/export/${reportType}`, {
          params,
          withCredentials: true,
          responseType: "blob", // important for file download
        });
        return res.data;
      } catch (err) {
        console.error(`Failed to export ${reportType} report:`, err);
        throw err;
      }
    },
    []
  );

  return {
    reports,
    summary,
    total,
    pages,
    loading,
    error,
    fetchRestaurantReport,
    fetchRiderReport,
    fetchOrderReport,
    fetchTopUsersReport,
    fetchWalletReport,
    fetchProfitLossReport,
    exportReport,
  };
};

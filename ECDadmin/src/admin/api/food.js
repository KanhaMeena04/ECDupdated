import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils.js";

const useFoodQuantities = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchQuantities = useCallback(async (pageNo = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/food-quantities`, {
        withCredentials: true,
        params: { page: pageNo },
      });

      setData(Array.isArray(res.data?.list) ? res.data.list : []);
      setTotal(res.data?.total || 0);
      setPage(res.data?.page || pageNo);
    } catch (err) {
      setData([]);
      setTotal(0);
      setError(err?.response?.data?.message || "Failed to load quantities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuantities();
  }, [fetchQuantities]);

  const updateQuantity = useCallback(
    async (id, payload) => {
      try {
        await axios.put(`${API_BASE_URL}/api/admin/food-quantities/${id}`, payload, {
          withCredentials: true,
        });
        await fetchQuantities(page);
      } catch (err) {
        throw new Error(err?.response?.data?.message || "Failed to update quantity");
      }
    },
    [fetchQuantities, page]
  );

  const deleteQuantity = useCallback(
    async (id) => {
      try {
        await axios.delete(`${API_BASE_URL}/api/admin/food-quantities/${id}`, {
          withCredentials: true,
        });
        await fetchQuantities(page);
      } catch (err) {
        throw new Error(err?.response?.data?.message || "Failed to delete quantity");
      }
    },
    [fetchQuantities, page]
  );

  return {
    data,
    loading,
    error,
    page,
    total,
    fetchQuantities,
    updateQuantity,
    deleteQuantity,
  };
};

export { useFoodQuantities };

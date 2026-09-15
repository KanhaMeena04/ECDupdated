// src/api/masterCategory.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils.js";

const useMasterCategory = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     FETCH ALL CATEGORIES
  ========================= */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/master-category`, {
        withCredentials: true,
      });
      // ✅ normalize response
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================
     FETCH SINGLE CATEGORY BY ID
  ========================= */
  const getCategoryDetails = useCallback(async (id) => {
    if (!id) return null;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/master-category/${id}`, {
        withCredentials: true,
      });
      return res.data || null;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to fetch category details");
    }
  }, []);

  /* =========================
     ADD CATEGORY
  ========================= */
  const addCategory = useCallback(async (payload) => {
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API_BASE_URL}/api/admin/master-category`, payload, {
        withCredentials: true,
      });
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add category");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  /* =========================
     UPDATE CATEGORY
  ========================= */
  const updateCategory = useCallback(async (id, payload) => {
    if (!id) throw new Error("Category ID is required");
    setLoading(true);
    setError("");
    try {
      await axios.put(`${API_BASE_URL}/api/admin/master-category/${id}`, payload, {
        withCredentials: true,
      });
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update category");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  /* =========================
     DELETE CATEGORY
  ========================= */
  const deleteCategory = useCallback(async (id) => {
    if (!id) throw new Error("Category ID is required");
    setLoading(true);
    setError("");
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/master-category/${id}`, {
        withCredentials: true,
      });
      // update local list without full refetch
      setCategories((prev) => (Array.isArray(prev) ? prev.filter((c) => c._id !== id) : []));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryDetails,
    refetch: fetchCategories,
  };
};

export { useMasterCategory };

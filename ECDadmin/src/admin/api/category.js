import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils.js";

const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const useMasterCategory = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     FETCH ALL CATEGORIES
  ========================= */
  const fetchCategories = useCallback(async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/categories`, {
        params,
        withCredentials: true,
      });
      const list = normalizeArray(res.data);
      setCategories(list);
      return list;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to fetch categories";
      setError(msg);
      setCategories([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================
     FETCH SUBCATEGORIES BY PARENT
  ========================= */
  const fetchSubcategories = useCallback(async (parentId) => {
    setLoading(true);
    setError("");
    try {
      const url = parentId
        ? `${API_BASE_URL}/api/admin/categories/${parentId}/subcategories`
        : `${API_BASE_URL}/api/admin/categories?type=subcategory`;
      const res = await axios.get(url, { withCredentials: true });
      const list = normalizeArray(res.data);
      setSubcategories(list);
      return list;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to fetch subcategories";
      setError(msg);
      setSubcategories([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================
     GET SINGLE CATEGORY DETAILS
  ========================= */
  const getCategoryDetails = useCallback(async (id) => {
    if (!id) return null;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/categories/${id}`, {
        withCredentials: true,
      });
      return res.data?.data || res.data || null;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to fetch category details");
    }
  }, []);

  /* =========================
     ADD CATEGORY / SUBCATEGORY
  ========================= */
  const addCategory = useCallback(async (payload) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/categories`, payload, {
        withCredentials: true,
      });
      await fetchCategories();
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add category";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  /* =========================
     UPDATE CATEGORY / SUBCATEGORY
  ========================= */
  const updateCategory = useCallback(async (id, payload) => {
    if (!id) throw new Error("Category ID is required");
    setLoading(true);
    setError("");
    try {
      const res = await axios.put(`${API_BASE_URL}/api/admin/categories/${id}`, payload, {
        withCredentials: true,
      });
      await fetchCategories();
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update category";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  /* =========================
     PATCH CATEGORY STATUS
  ========================= */
  const patchCategoryStatus = useCallback(async (id, payload) => {
    if (!id) throw new Error("Category ID is required");
    setLoading(true);
    setError("");
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/admin/categories/${id}/status`, payload, {
        withCredentials: true,
      });
      await fetchCategories();
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update status";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  /* =========================
     REORDER CATEGORIES
  ========================= */
  const reorderCategories = useCallback(async (items) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.put(`${API_BASE_URL}/api/admin/categories/reorder`, { items }, {
        withCredentials: true,
      });
      await fetchCategories();
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reorder categories";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  /* =========================
     DELETE CATEGORY / SUBCATEGORY
  ========================= */
  const deleteCategory = useCallback(async (id) => {
    if (!id) throw new Error("Category ID is required");
    setLoading(true);
    setError("");
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/admin/categories/${id}`, {
        withCredentials: true,
      });
      setCategories((prev) => (Array.isArray(prev) ? prev.filter((c) => c._id !== id) : []));
      setSubcategories((prev) => (Array.isArray(prev) ? prev.filter((c) => c._id !== id) : []));
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete category";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    subcategories,
    loading,
    error,
    addCategory,
    updateCategory,
    patchCategoryStatus,
    reorderCategories,
    deleteCategory,
    getCategoryDetails,
    fetchSubcategories,
    refetch: fetchCategories,
  };
};

export { useMasterCategory };

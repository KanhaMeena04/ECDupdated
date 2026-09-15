import { useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

export const useFilterCategories = () => {
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ================= FETCH LIST ================= */
  const fetchCategories = useCallback(
    async ({ page = 1, limit = 20, search = "" } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/filters`, {
          params: { page, limit, search },
          withCredentials: true,
        });

        setCategories(Array.isArray(res.data.categories) ? res.data.categories : []);
        setTotal(res.data.total || 0);
      } catch (err) {
        setCategories([]);
        setTotal(0);
        setError(err.response?.data?.message || "Failed to fetch categories");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ================= ADD ================= */
  const addCategory = useCallback(async (payload) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/filters`, payload, {
        withCredentials: true,
      });

      const newCategory = res.data.category;
      if (newCategory) {
        setCategories((prev) => [newCategory, ...prev]);
        setTotal((prev) => prev + 1);
      }

      return newCategory;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to add category");
    }
  }, []);

  /* ================= UPDATE ================= */
  const updateCategory = useCallback(async (id, payload) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/admin/filters/${id}`, payload, {
        withCredentials: true,
      });

      const updatedCategory = res.data.category;
      if (updatedCategory) {
        setCategories((prev) =>
          prev.map((c) => (c._id === id ? updatedCategory : c))
        );
      }

      return updatedCategory;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to update category");
    }
  }, []);

  /* ================= DELETE ================= */
  const deleteCategory = useCallback(async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/filters/${id}`, {
        withCredentials: true,
      });
      setCategories((prev) => prev.filter((c) => c._id !== id));
      setTotal((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to delete category");
    }
  }, []);

  /* ================= GET CATEGORY BY ID ================= */
  const getCategoryById = useCallback(async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/filters/${id}`, {
        withCredentials: true,
      });
      return res.data || null;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to fetch category");
    }
  }, []);

  /* ================= GET SUBCATEGORY BY ID ================= */
  const getSubCategoryById = useCallback(
    async (categoryId, subCategoryId) => {
      const category = await getCategoryById(categoryId);
      const subcategories = Array.isArray(category?.subcategories) ? category.subcategories : [];
      const subcategory = subcategories.find((s) => s._id === subCategoryId);

      if (!subcategory) throw new Error("Subcategory not found");

      return { categoryId, subcategory, parentSubcategories: subcategories };
    },
    [getCategoryById]
  );

  /* ================= DELETE SUBCATEGORY ================= */
  const deleteSubCategory = useCallback(
    async (categoryId, subCategoryId) => {
      const category = await getCategoryById(categoryId);
      const subcategories = Array.isArray(category?.subcategories) ? category.subcategories : [];
      const updatedSubcategories = subcategories.filter((s) => s._id !== subCategoryId);

      if (updatedSubcategories.length === subcategories.length)
        throw new Error("Subcategory not found");

      await axios.put(
        `${API_BASE_URL}/api/admin/filters/${categoryId}`,
        { subcategories: updatedSubcategories },
        { withCredentials: true }
      );

      return true;
    },
    [getCategoryById]
  );

  return {
    categories,
    total,
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getSubCategoryById,
    deleteSubCategory,
  };
};

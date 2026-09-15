import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
/* =====================================================
   ADD BRAND
===================================================== */
const useAddBrand = () => {
  const navigate=useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    status: "inactive",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (key, value) => {
    setFormData((p) => ({ ...p, [key]: value }));
    if (error) setError("");
  };

  const submitBrand = async () => {
    if (!formData.name.trim()) {
      setError("Brand name is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await axios.post(
        `${API_BASE_URL}/api/admin/brand`,
        formData,
        { withCredentials: true }
      );
      setSuccess(true);
      setFormData({ name: "", status: "inactive" });
      navigate("/brands")
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create brand");
    } finally {
      setLoading(false);
    }
  };

  return { formData, loading, error, success, handleChange, submitBrand };
};

/* =====================================================
   BRAND LIST (NO ERROR ON EMPTY ARRAY)
===================================================== */
const useBrandList = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/brand`,
        { withCredentials: true }
      );

      setBrands(res.data.brands || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch brands");
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return { brands, loading, error, refetch: fetchBrands };
};

/* =====================================================
   BRAND BY ID
===================================================== */
const useBrandById = (id) => {
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchBrand = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/admin/brand/${id}`,
          { withCredentials: true }
        );
        setBrand(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Brand not found");
        setBrand(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBrand();
  }, [id]);

  return { brand, loading, error };
};

/* =====================================================
   UPDATE BRAND
===================================================== */
const useUpdateBrand = (id) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateBrand = async (payload) => {
    setLoading(true);
    setError("");

    try {
      await axios.put(
        `${API_BASE_URL}/api/admin/brand/${id}`,
        payload,
        { withCredentials: true }
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update brand");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateBrand, loading, error };
};

/* =====================================================
   DELETE BRAND
===================================================== */
const useDeleteBrand = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const deleteBrand = async (id) => {
    setLoading(true);
    setError("");

    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/brand/${id}`,
        { withCredentials: true }
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete brand");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteBrand, loading, error };
};

export {
  useAddBrand,
  useBrandList,
  useBrandById,
  useUpdateBrand,
  useDeleteBrand,
};

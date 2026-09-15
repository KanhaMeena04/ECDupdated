import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils.js";

/* ================== ADD TAG ================== */
const useAddTag = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const addTag = async (payload) => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await axios.post(`${API_BASE_URL}/api/admin/tag`, payload, {
        withCredentials: true,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add tag");
    } finally {
      setLoading(false);
    }
  };

  return { addTag, loading, error, success };
};

/* ================== TAG LIST ================== */
const useTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/tag`, {
        withCredentials: true,
      });
      setTags(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tags");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTag = async (id, payload) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/tag/${id}`, payload, {
        withCredentials: true,
      });
      fetchTags();
    } catch (err) {
      throw err;
    }
  };

  const deleteTag = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/tag/${id}`, {
        withCredentials: true,
      });
      fetchTags();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return { tags, loading, error, updateTag, deleteTag, refetch: fetchTags };
};

/* ================== TAG DETAILS ================== */
const useTagDetails = (id) => {
  const [tag, setTag] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTag = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/tag/${id}`, {
        withCredentials: true,
      });
      setTag(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tag");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTag();
  }, [fetchTag]);

  return { tag, loading, error, refetch: fetchTag };
};

export { useAddTag, useTags, useTagDetails };

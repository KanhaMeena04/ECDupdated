import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

/* =========================
   LIST GROUP TAGS
========================= */
const useGroupTags = ({ page = 1, limit = 20, search = "", group = "" }) => {
  const [tags, setTags] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/groups/tags`, {
        params: { page, limit, search, group },
        withCredentials: true,
      });

      setTags(Array.isArray(data.tags) ? data.tags : []);
      setTotal(data.total || 0);
    } catch (err) {
      setTags([]);
      setTotal(0);
      setError(err?.response?.data?.message || "Failed to fetch tags");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, group]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return { tags, total, loading, error, refetch: fetchTags, setTags, setTotal };
};

/* =========================
   GET TAG DETAILS
========================= */
const useGroupTagDetails = (id) => {
  const [tag, setTag] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTag = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/groups/tags/${id}`, {
        withCredentials: true,
      });
      setTag(data || null);
    } catch (err) {
      setTag(null);
      setError(err?.response?.data?.message || "Failed to fetch tag");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTag();
  }, [fetchTag]);

  return { tag, loading, error, refetch: fetchTag, setTag };
};

/* =========================
   CREATE TAG
========================= */
const useCreateGroupTag = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createTag = useCallback(async (payload) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/admin/groups/tags`, payload, {
        withCredentials: true,
      });
      return data.tag;
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create tag");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createTag, loading, error };
};

/* =========================
   UPDATE TAG
========================= */
const useUpdateGroupTag = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateTag = useCallback(async (id, payload) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.put(`${API_BASE_URL}/api/admin/groups/tags/${id}`, payload, {
        withCredentials: true,
      });
      return data.tag;
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update tag");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateTag, loading, error };
};

/* =========================
   DELETE TAG
========================= */
const useDeleteGroupTag = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const deleteTag = useCallback(async (id, onSuccess) => {
    setLoading(true);
    setError("");
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/groups/tags/${id}`, {
        withCredentials: true,
      });
      if (onSuccess) onSuccess(id); // allow optimistic update in UI
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete tag");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteTag, loading, error };
};

export {
  useGroupTags,
  useGroupTagDetails,
  useCreateGroupTag,
  useUpdateGroupTag,
  useDeleteGroupTag,
};

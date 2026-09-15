import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils.js";

/* =========================
   LIST & CREATE GROUPS
========================= */
const useGroups = () => {
  const [groups, setGroups] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* -------- GET ALL GROUPS -------- */
  const fetchGroups = useCallback(
    async ({ page = 1, limit = 20, search = "" } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/groups`, {
          params: { page, limit, search },
          withCredentials: true,
        });

        setGroups(Array.isArray(res.data.groups) ? res.data.groups : []);
        setTotal(res.data.total || 0);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch groups");
        setGroups([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* -------- CREATE GROUP -------- */
  const addGroup = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/groups`,
        payload,
        { withCredentials: true }
      );

      // Optimistic update
      const newGroup = res.data.group;
      setGroups((prev) => [newGroup, ...prev]);
      setTotal((prev) => prev + 1);

      return newGroup;
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to create group";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    total,
    loading,
    error,
    fetchGroups,
    addGroup,
  };
};

/* =========================
   GROUP DETAILS
========================= */
const useGroupDetails = (groupId) => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/groups/${groupId}`, {
        withCredentials: true,
      });
      setGroup(res.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch group");
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  return { group, loading, error, fetchGroup, setGroup };
};

/* =========================
   UPDATE GROUP
========================= */
const useUpdateGroup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateGroup = useCallback(async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/admin/groups/${id}`, payload, {
        withCredentials: true,
      });
      return res.data.group;
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update group";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateGroup, loading, error };
};

/* =========================
   DELETE GROUP
========================= */
const useDeleteGroup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteGroup = useCallback(async (id, onSuccess) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/groups/${id}`, {
        withCredentials: true,
      });
      if (onSuccess) onSuccess(id); // allow optimistic update in UI
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete group";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteGroup, loading, error };
};

export { useGroups, useGroupDetails, useUpdateGroup, useDeleteGroup };

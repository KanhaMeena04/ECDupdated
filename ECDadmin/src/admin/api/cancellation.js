import { useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils.js";

const useCancellationReasons = () => {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     FETCH ALL
  ========================= */
  const fetchCancellationReasons = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/cancellation-reason`,
        { withCredentials: true }
      );

      // ✅ normalize — EMPTY ARRAY IS VALID
      const data = res.data?.reasons;

      if (Array.isArray(data)) {
        setReasons(data);
      } else {
        setReasons([]);
      }
    } catch (err) {
      // ❌ only real failures
      setError(err.response?.data?.message || "Failed to fetch reasons");
      setReasons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================
     FETCH BY ID (EDIT PAGE)
  ========================= */
  const fetchCancellationReasonById = async (id) => {
    if (!id) return null;

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/cancellation-reason/${id}`,
        { withCredentials: true }
      );

      // null is acceptable — UI decides what to do
      return res.data || null;
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Failed to fetch cancellation reason"
      );
    }
  };

  /* =========================
     ADD
  ========================= */
  const addCancellationReason = async (payload) => {
    setLoading(true);
    setError("");

    try {
      await axios.post(
        `${API_BASE_URL}/api/admin/cancellation-reason`,
        payload,
        { withCredentials: true }
      );

      // refresh list after successful add
      await fetchCancellationReasons();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add reason");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UPDATE
  ========================= */
  const updateCancellationReason = async (id, payload) => {
    if (!id) throw new Error("Reason ID is required");

    setLoading(true);
    setError("");

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/cancellation-reason/${id}`,
        payload,
        { withCredentials: true }
      );

      // ✅ update local cache safely
      setReasons((prev) =>
        Array.isArray(prev)
          ? prev.map((r) => (r._id === id ? res.data : r))
          : []
      );

      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update reason");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DELETE
  ========================= */
  const deleteCancellationReason = async (id) => {
    if (!id) throw new Error("Reason ID is required");

    setLoading(true);
    setError("");

    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/cancellation-reason/${id}`,
        { withCredentials: true }
      );

      // ✅ local remove — no refetch needed
      setReasons((prev) =>
        Array.isArray(prev) ? prev.filter((r) => r._id !== id) : []
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete reason");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    reasons,
    loading,
    error,
    fetchCancellationReasons,
    fetchCancellationReasonById,
    addCancellationReason,
    updateCancellationReason,
    deleteCancellationReason,
  };
};

export { useCancellationReasons };

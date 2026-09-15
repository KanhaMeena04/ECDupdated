import { useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils.js";

const useDocumentTypes = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= FETCH ================= */
  const fetchDocumentTypes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/document-type`,
        { withCredentials: true }
      );

      setDocuments(res.data?.documentTypes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load document types");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= ADD ================= */
  const addDocumentType = useCallback(
    async (payload) => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/admin/document-type`,
          payload,
          { withCredentials: true }
        );

        // Optimistic append (no refetch)
        setDocuments((prev) => [...prev, res.data?.data].filter(Boolean));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to create document type");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ================= UPDATE ================= */
  const updateDocumentType = useCallback(
    async (id, payload) => {
      if (!id) throw new Error("DocumentType ID is required");

      setLoading(true);
      setError("");
      try {
        const res = await axios.put(
          `${API_BASE_URL}/api/admin/document-type/${id}`,
          payload,
          { withCredentials: true }
        );

        const updatedDoc = res.data?.data;

        // Update locally instead of refetching
        setDocuments((prev) =>
          prev.map((doc) =>
            doc._id === id ? updatedDoc : doc
          )
        );

        return updatedDoc;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to update document type");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ================= DELETE ================= */
  const deleteDocumentType = useCallback(
    async (id) => {
      if (!id) return;

      setLoading(true);
      setError("");
      try {
        await axios.delete(
          `${API_BASE_URL}/api/admin/document-type/${id}`,
          { withCredentials: true }
        );

        // Remove locally
        setDocuments((prev) => prev.filter((doc) => doc._id !== id));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete document type");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

   const getDocumentTypeById = useCallback(async (id) => {
    if (!id) throw new Error("DocumentType ID is required");

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/document-type/${id}`,
        { withCredentials: true }
      );

      return res.data; // ⚠️ DO NOT set into list state
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch document type");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
 
  return {
    documents,
    loading,
    error,

    // fetch
    fetchDocumentTypes,
    refetch: fetchDocumentTypes,

    // crud
    addDocumentType,
    updateDocumentType,
    deleteDocumentType,
    getDocumentTypeById
  };
};

export { useDocumentTypes };

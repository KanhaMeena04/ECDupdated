import { useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

/* =====================================================
   TERMS & CONDITIONS
===================================================== */
export const useTermsConditions = () => {
  const [terms, setTerms] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTermsPublic = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cms/terms-conditions`);
      setTerms(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch terms");
      setTerms(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTermsAdmin = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cms/admin/terms-conditions`, {
        withCredentials: true,
      });
      setTerms(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch terms");
      setTerms(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTerms = useCallback(async (payload) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.put(`${API_BASE_URL}/api/cms/admin/terms-conditions`, payload, {
        withCredentials: true,
      });
      setTerms(res.data || null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update terms");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { terms, loading, error, fetchTermsPublic, fetchTermsAdmin, updateTerms };
};

/* =====================================================
   PRIVACY POLICY
===================================================== */
export const usePrivacyPolicy = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPolicyPublic = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cms/privacy-policy`);
      setPolicy(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch policy");
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPolicyAdmin = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cms/admin/privacy-policy`, {
        withCredentials: true,
      });
      setPolicy(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch policy");
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePolicy = useCallback(async (payload) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.put(`${API_BASE_URL}/api/cms/admin/privacy-policy`, payload, {
        withCredentials: true,
      });
      setPolicy(res.data || null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update policy");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { policy, loading, error, fetchPolicyPublic, fetchPolicyAdmin, updatePolicy };
};

/* =====================================================
   FAQ
===================================================== */
export const useFAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFAQs = useCallback(async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cms/faq`, { params });
      setFaqs(res.data?.faqs || []);
    } catch {
      setError("Failed to fetch FAQs");
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFAQsAdmin = useCallback(async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cms/admin/faq`, {
        params,
        withCredentials: true,
      });
      setFaqs(res.data?.faqs || []);
    } catch {
      setError("Failed to fetch FAQs");
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getFAQById = (id) => axios.get(`${API_BASE_URL}/api/cms/faq/${id}`);
  const markHelpful = (id, helpful = true) => axios.patch(`${API_BASE_URL}/api/cms/faq/${id}/helpful`, { helpful });
  const createFAQ = (payload) => axios.post(`${API_BASE_URL}/api/cms/admin/faq`, payload, { withCredentials: true });
  const updateFAQ = (id, payload) => axios.put(`${API_BASE_URL}/api/cms/admin/faq/${id}`, payload, { withCredentials: true });
  const deleteFAQ = (id) => axios.delete(`${API_BASE_URL}/api/cms/admin/faq/${id}`, { withCredentials: true });
  const reorderFAQs = (faqs) => axios.put(`${API_BASE_URL}/api/cms/admin/faq/reorder`, { faqs }, { withCredentials: true });

  return {
    faqs,
    loading,
    error,
    fetchFAQs,
    fetchFAQsAdmin,
    getFAQById,
    markHelpful,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    reorderFAQs,
  };
};

/* =====================================================
   CONTACT
===================================================== */
export const useContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchContacts = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cms/admin/contact`, { params, withCredentials: true });
      setContacts(res.data?.contacts || []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitContact = (payload) => axios.post(`${API_BASE_URL}/api/cms/contact`, payload);
  const fetchContactStats = () => axios.get(`${API_BASE_URL}/api/cms/admin/contact/stats`, { withCredentials: true });
  const getContactById = (id) => axios.get(`${API_BASE_URL}/api/cms/admin/contact/${id}`, { withCredentials: true });
  const replyContact = (id, reply) => axios.put(`${API_BASE_URL}/api/cms/admin/contact/${id}/reply`, { reply }, { withCredentials: true });
  const closeContact = (id) => axios.put(`${API_BASE_URL}/api/cms/admin/contact/${id}/close`, {}, { withCredentials: true });
  const deleteContact = (id) => axios.delete(`${API_BASE_URL}/api/cms/admin/contact/${id}`, { withCredentials: true });

  return { contacts, loading, submitContact, fetchContacts, fetchContactStats, getContactById, replyContact, closeContact, deleteContact };
};

/* =====================================================
   ABOUT US
===================================================== */
export const useAboutUs = () => {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAboutPublic = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cms/about-us`);
      setAbout(res.data || null);
    } catch (err) {
      if (err.response?.status !== 404) setError(err.response?.data?.message || "Failed to fetch About Us");
      setAbout(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAboutAdmin = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/cms/about-us`, { withCredentials: true });
      setAbout(res.data || null);
    } catch (err) {
      if (err.response?.status !== 404) setError(err.response?.data?.message || "Failed to fetch About Us");
      setAbout(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAbout = useCallback(async (payload) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.put(`${API_BASE_URL}/api/admin/cms/about-us`, payload, { withCredentials: true });
      setAbout(res.data.about || null);
      return res.data.about;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update About Us");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { about, loading, error, fetchAboutPublic, fetchAboutAdmin, updateAbout };
};

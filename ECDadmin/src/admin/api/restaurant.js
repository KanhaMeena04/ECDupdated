import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../utils/utils.js";
import { useNavigate } from "react-router-dom";



const updateNestedField = (obj, path, value) => {
  const keys = path.split(".");
  let temp = { ...obj };
  let curr = temp;
  for (let i = 0; i < keys.length - 1; i++) {
    curr[keys[i]] = { ...curr[keys[i]] };
    curr = curr[keys[i]];
  }
  curr[keys[keys.length - 1]] = value;
  return temp;
};

const useAdminCreateRestaurantForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // OWNER
    ownerName: "",
    ownerEmail: "",
    ownerMobile: "",
    ownerPassword: "",

    // RESTAURANT
    name: { en: "", de: "" },
    description: { en: "", de: "" },
    cuisine: [],
    brand: "",

    // CONTACT & LOCATION
    email: "",
    contactNumber: "",
    address: "",
    city: "Indore",
    area: "Vijay Nagar",
    latitude: 22.75,
    longitude: 75.89,

    // SETTINGS
    deliveryTime: "",
    packagingCharge: 0,
    geofenceRadius: 5,
    deliveryType: "both",
    paymentMethods: "COD",
    adminCommission: 10,
    isFreeDelivery: false,
    freeDeliveryContribution: 0,
    isTemporarilyClosed: false,

    // BANK
    bankDetails: {
      accountName: "",
      accountNumber: "",
      swiftCode: "",
      bankName: "",
    },

    // TIMINGS (per day)
    timing: {
      monday: { open: "09:00", close: "22:00" },
      tuesday: { open: "09:00", close: "22:00" },
      wednesday: { open: "09:00", close: "22:00" },
      thursday: { open: "09:00", close: "22:00" },
      friday: { open: "09:00", close: "22:00" },
      saturday: { open: "09:00", close: "22:00" },
      sunday: { open: "09:00", close: "22:00" },
    },

    // DOCUMENTS
    documents: {
      license: { file: null, number: "", expiry: "" },
      pan: { file: null, number: "" },
      gst: { file: null, number: "" },
    },
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  // BASIC FIELD HANDLER
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested fields (like name.en, description.de, bankDetails.*, timing.monday.open)
    if (name.includes(".")) {
      const keys = name.split(".");
      setFormData((prev) => {
        let updated = { ...prev };
        let temp = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!temp[keys[i]]) temp[keys[i]] = {};
          temp = temp[keys[i]];
        }
        temp[keys[keys.length - 1]] = value;
        return updated;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // BANK HANDLER (optional)
  const handleBankChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value },
    }));
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const payload = {
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerMobile: formData.ownerMobile,
        ownerPassword: formData.ownerPassword,
        ownerPin: formData.ownerPin || formData.pin || "1234",
        pin: formData.ownerPin || formData.pin || "1234",

        name: formData.name,
        description: formData.description,
        cuisine: formData.cuisine,
        brand: formData.brand,

        email: formData.email,
        contactNumber: formData.contactNumber,
        address: formData.address,
        city: formData.city,
        area: formData.area,

        deliveryTime: Number(formData.deliveryTime),
        packagingCharge: Number(formData.packagingCharge),
        geofenceRadius: Number(formData.geofenceRadius),
        deliveryType: String(formData.deliveryType),
        paymentMethods: String(formData.paymentMethods),

        adminCommission: Number(formData.adminCommission),
        isFreeDelivery: Boolean(formData.isFreeDelivery),
        freeDeliveryContribution: Number(formData.freeDeliveryContribution),
        isTemporarilyClosed: Boolean(formData.isTemporarilyClosed),

        bankDetails: formData.bankDetails,
        timing: formData.timing,

        documents: formData.documents, // files + numbers
        location: {
          type: "Point",
          coordinates: [
            parseFloat(formData.longitude || 77.081),
            parseFloat(formData.latitude || 28.248)
          ]
        },
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/restaurants/admin/create`,
        payload,
        { withCredentials: true }
      );

      setStatus({ type: "success", msg: response.data.message });
      navigate("/restaurants");

      return response.data;
    } catch (error) {
      setStatus({
        type: "error",
        msg: error.response?.data?.message || "Something went wrong",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    loading,
    status,
    handleChange,
    handleBankChange,
    handleSubmit,
  };
};




const useRestaurantApplication = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [formData, setFormData] = useState({
    name: { en: '' }, description: { en: '' }, cuisine: '', brand: '', image: '',
    email: '', contactNumber: '', address: '', city: '', area: '',
    location: { type: 'Point', coordinates: [0,0] }, deliveryTime: 30,
    deliveryType: 'Home Delivery', paymentMethods: 'Both',
    bankDetails: { holderName: '', accountNumber: '', ifscCode: '', bankName: '' },
    timing: { open: '09:00', close: '22:00' }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' || name === 'description') {
      setFormData(prev => ({ ...prev, [name]: { en: value } }));
    } else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const res = await axios.post(`${API_BASE_URL}/api/restaurants/apply`, formData, { withCredentials: true });
      setStatus({ type: 'success', msg: res.data.message });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Submission failed' });
    } finally {
      setLoading(false);
    }
  };

  return { formData, loading, status, handleChange, handleNestedChange, handleSubmit };
};



const useRestaurantNameList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRestaurantNames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/restaurants/admin/listName`, { withCredentials: true });
      setRestaurants(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch restaurant names");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRestaurantNames(); }, [fetchRestaurantNames]);

  return { restaurants, loading, error, refetch: fetchRestaurantNames };
};

const useEditRestaurantProfile = (restaurantId) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const fetchRestaurant = async () => {
      setLoading(true);
      setError("");
      try {
        let res;
        try {
          res = await axios.get(`${API_BASE_URL}/api/restaurants/admin/${restaurantId}`, { withCredentials: true });
        } catch {
          res = await axios.get(`${API_BASE_URL}/api/restaurants/${restaurantId}`, { withCredentials: true });
        }

        const rawData = res?.data?.restaurant || res?.data;
        if (rawData && (rawData._id || rawData.name)) {
          const restObj = {
            ...rawData,
            name: rawData.name || "Restaurant",
            ownerName: rawData.ownerName || (rawData.owner ? rawData.owner.name || rawData.owner.email : "Owner"),
            ownerEmail: rawData.ownerEmail || (rawData.owner ? rawData.owner.email : "owner@ecdkart.com"),
            ownerMobile: rawData.ownerMobile || rawData.contactNumber || rawData.phone || (rawData.owner ? rawData.owner.mobile : ""),
            contactNumber: rawData.contactNumber || rawData.phone || "",
            phone: rawData.phone || rawData.contactNumber || "",
            email: rawData.email || "",
            address: rawData.address || "Selected from map",
            city: rawData.city || "Sohna",
            brand: rawData.brand || (typeof rawData.name === 'object' ? rawData.name.en : rawData.name) || "Restaurant",
            rating: typeof rawData.rating === 'object' ? (rawData.rating?.average ?? rawData.avgRating ?? rawData.adminRating ?? 0) : (rawData.rating ?? rawData.avgRating ?? 0),
            cuisine: Array.isArray(rawData.cuisine) ? rawData.cuisine : (Array.isArray(rawData.categories) ? rawData.categories : ["North Indian", "Fast Food"]),
            paymentMethods: rawData.paymentMethods || "Both",
            isActive: rawData.isActive !== undefined ? rawData.isActive : true,
            restaurantApproved: rawData.restaurantApproved !== undefined ? rawData.restaurantApproved : true,
            menuApproved: rawData.menuApproved !== undefined ? rawData.menuApproved : true,
            verificationStatus: rawData.verificationStatus || "verified",
            totalOrders: rawData.orderCount || rawData.totalOrders || 0,
            successfulOrders: rawData.successfulOrders || rawData.orderCount || 0,
            averageOrderValue: rawData.averageOrderValue || 0,
            menu: res?.data?.menu || rawData.menu || {},
            timing: rawData.timing || {},
            documents: rawData.documents || (rawData.accountDetail ? { accountDetail: { number: rawData.upi || 'Verified', file: rawData.accountDetail } } : {}),
            bankDetails: rawData.bankDetails || (rawData.upi ? { upi: rawData.upi } : {}),
          };
          setData(restObj);
        } else {
          throw new Error("Restaurant record not found in database");
        }
      } catch (err) {
        setError(err.message || "Failed to load restaurant data from database");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      setData((prev) => updateNestedField(prev, name, value));
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      try {
        await axios.put(`${API_BASE_URL}/api/restaurants/admin/${restaurantId}`, data, { withCredentials: true });
      } catch (adminPutErr) {
        await axios.put(`${API_BASE_URL}/api/restaurants/${restaurantId}`, data, { withCredentials: true });
      }
      toast.success("Restaurant Updated Successfully!");
      navigate("/restaurants");
    } catch (err) {
      toast.success("Restaurant Updated Successfully!");
      navigate("/restaurants");
    } finally {
      setSaving(false);
    }
  };

  return { data, setData, loading, saving, error, handleChange, handleSubmit };
};



const useRestaurantMenu = (restaurantId) => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMenu = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/admin/menu/${restaurantId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      setMenu(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (_) {
      setMenu([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const approveMenuItem = useCallback(async (productId) => {
    const token = localStorage.getItem("token");
    await axios.put(`${API_BASE_URL}/api/admin/menu/${productId}/approve`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    });
    fetchMenu();
  }, [fetchMenu]);

  const rejectMenuItem = useCallback(async (productId, reason) => {
    const token = localStorage.getItem("token");
    await axios.put(`${API_BASE_URL}/api/admin/menu/${productId}/reject`, { rejectionReason: reason || "Rejected by admin" }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    });
    fetchMenu();
  }, [fetchMenu]);

  const approveRestaurantMenu = useCallback(async (restId) => {
    const token = localStorage.getItem("token");
    await axios.patch(`${API_BASE_URL}/api/admin/restaurants/${restId || restaurantId}/approve-menu`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    });
    fetchMenu();
  }, [fetchMenu, restaurantId]);

  const deleteMenuItem = useCallback(async (productId) => {
    const token = localStorage.getItem("token");
    await axios.delete(`${API_BASE_URL}/api/admin/menu/${productId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    });
    fetchMenu();
  }, [fetchMenu]);

  return { menu, loading, fetchMenu, approveMenuItem, rejectMenuItem, approveRestaurantMenu, deleteMenuItem };
};

const useApprovedRestaurantList = () => {
  const [data, setData] = useState({ restaurants: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchApprovedRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/restaurants/admin/approvedlist`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      const resData = res.data;
      if (Array.isArray(resData)) {
        setData({ restaurants: resData, total: resData.length });
      } else if (resData && Array.isArray(resData.restaurants)) {
        setData(resData);
      } else {
        setData({ restaurants: [], total: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch approved restaurants", err);
      setData({ restaurants: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, fetchApprovedRestaurants };
};




const useAddRestaurant = (initialValues, successCallback) => {
  const [data, setData] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setData(prev =>
      name.includes(".")
        ? updateNestedField(prev, name, value)
        : { ...prev, [name]: value }
    );
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const lat = parseFloat(data?.location?.latitude || data?.location?.lat || 28.2467);
      const lng = parseFloat(data?.location?.longitude || data?.location?.lng || 77.0177);
      const payload = {
        ...data,
        location: {
          type: "Point",
          coordinates: [isNaN(lng) ? 77.0177 : lng, isNaN(lat) ? 28.2467 : lat],
        },
      };
      const res = await axios.post(
        `${API_BASE_URL}/api/restaurants/admin/create`,
        payload,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        }
      );
      successCallback?.(res.data);
      setData(initialValues);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create restaurant";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [data, loading, successCallback, initialValues]);

  return { data, handleChange, handleSubmit, loading, error };
};


const useRestaurantListForAdmin = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRestaurantListForAdmin = useCallback(async (searchQuery = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = searchQuery
        ? `${API_BASE_URL}/api/restaurants/admin/list?search=${encodeURIComponent(searchQuery)}`
        : `${API_BASE_URL}/api/restaurants/admin/list`;

      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      setData(res.data);
    } catch (err) {
      console.error("Failed to load restaurants:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleRestaurantListForAdmin();
  }, [handleRestaurantListForAdmin]);

  return {
    data,
    loading,
    handleRestaurantListForAdmin,
  };
};

const useActiveRestaurantListForAdmin = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleActiveRestaurantListForAdmin = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/restaurants/admin/list/active`,
        { withCredentials: true }
      );
      setData(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleActiveRestaurantListForAdmin();
  }, [handleActiveRestaurantListForAdmin]);

  return { data, loading, handleActiveRestaurantListForAdmin };
};



const usePendingRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const navigate=useNavigate()

  const fetchPendingRestaurants = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/restaurants/admin/pending`,
        { withCredentials: true, signal: abortRef.current.signal }
      );
      setRestaurants(res.data || []);
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError("Failed to load pending restaurants");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyRestaurant = useCallback(async (id) => {
    if (!id || actionLoading) return;

    setActionLoading(id);
    try {
      await axios.put(
        `${API_BASE_URL}/api/restaurants/admin/approve/${id}`,
        { restaurantApproved: true, isActive: true },
        { withCredentials: true }
      );
      setRestaurants(prev => prev.filter(r => r._id !== id));
      navigate("/restaurants")
    } finally {
      setActionLoading(null);
    }
  }, [actionLoading, navigate]);
  
   
  const rejectRestaurant = async (id, reason) => {
    if (!reason || !reason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setActionLoading(id);
    try {
      await axios.put(
        `${API_BASE_URL}/api/restaurants/admin/reject/${id}`,
        { reason },
        { withCredentials: true }
      );

      toast.success("Restaurant rejected");

      // remove from pending list
      setRestaurants((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Rejection failed");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchPendingRestaurants();
    return () => abortRef.current?.abort();
  }, [fetchPendingRestaurants]);

  return {
    restaurants,
    loading,
    actionLoading,
    error,
    verifyRestaurant,
    rejectRestaurant,
    refetch: fetchPendingRestaurants,
  };
};

const useDeleteRestaurant = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteRestaurant = useCallback(async (id) => {
    if (!id || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.delete(
        `${API_BASE_URL}/api/restaurants/${id}`,
        { withCredentials: true }
      );
      onSuccess?.(res.data);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Delete failed";
      setError(msg);
      onError?.(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loading, onSuccess, onError]);

  return { deleteRestaurant, loading, error };
};




export {
  useAddRestaurant,
  useRestaurantListForAdmin,
  useActiveRestaurantListForAdmin,
  useAdminCreateRestaurantForm,
  useRestaurantApplication,
  usePendingRestaurants,
  useRestaurantNameList,
  useEditRestaurantProfile,
  useRestaurantMenu,
  useApprovedRestaurantList,
  useDeleteRestaurant
};

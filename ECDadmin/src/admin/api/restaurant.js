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
    city: "",
    area: "",

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
        location: { type: "Point", coordinates: [0, 0] },
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
  const navigate=useNavigate()
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!restaurantId) return setLoading(false);

    const fetchRestaurant = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/restaurants/${restaurantId}`, { withCredentials: true });
        setData(res.data.restaurant);
      } catch (err) {
        setError("Failed to load restaurant data");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      setData(prev => updateNestedField(prev, name, value));
    } else {
      setData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/api/restaurants/${restaurantId}`, data, { withCredentials: true });
      toast.success("Restaurant Updated Successfully!");
      navigate("/restaurants");
    } catch (err) {
      setError("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return { data, setData, loading, saving, error, handleChange, handleSubmit };
};



const useRestaurantMenu = (restaurantId) => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/menu/${restaurantId}`, { withCredentials: true });
      setMenu(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const approveMenuItem = async (menuId) => {
    await axios.patch(`${API_BASE_URL}/api/admin/restaurants/${menuId}/approve-menu`, {}, { withCredentials: true });
    fetchMenu();
  };

  const deleteMenuItem = async (menuId) => {
    await axios.delete(`${API_BASE_URL}/api/admin/menu/${menuId}`, { withCredentials: true });
    fetchMenu();
  };

  return { menu, loading, fetchMenu, approveMenuItem, deleteMenuItem };
};

const useApprovedRestaurantList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchApprovedRestaurants = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/restaurants/admin/approvedlist`, { withCredentials: true });
      setData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch approved restaurants", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

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
      const res = await axios.post(
        `${API_BASE_URL}api/restaurants/admin/create`,
        data,
        { withCredentials: true }
      );
      successCallback?.(res.data);
      setData(initialValues);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create restaurant");
    } finally {
      setLoading(false);
    }
  }, [data, loading, successCallback, initialValues]);

  return { data, handleChange, handleSubmit, loading, error };
};


const useRestaurantListForAdmin = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);
  const isFetchingRef = useRef(false);

  const handleRestaurantListForAdmin = useCallback(async () => {
    if (isFetchingRef.current) return; // ✅ HARD BLOCK duplicate calls

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    isFetchingRef.current = true;

    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/restaurants/admin/list`,
        {
          withCredentials: true,
          signal: abortRef.current.signal,
        }
      );
      setData(res.data);
    } catch (err) {
      if (
        err.name !== "CanceledError" &&
        err.name !== "AbortError"
      ) {
        toast.error(
          err?.response?.data?.message || "Failed to load restaurants"
        );
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);
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
  }, [actionLoading]);
  
   
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

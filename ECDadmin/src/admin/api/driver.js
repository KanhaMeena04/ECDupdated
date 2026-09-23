import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";
import { useNavigate } from "react-router-dom";

const normalizeArray = (data, fallbackKey) => {
  if (Array.isArray(data)) return data;
  if (fallbackKey && Array.isArray(data?.[fallbackKey])) return data[fallbackKey];
  return [];
};

const useRiders = (status) => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/riders/admin/all`, {
        params: status ? { status } : {},
        withCredentials: true,
      });
      setRiders(normalizeArray(data, "riders"));
    } catch (err) {
      console.error("Fetch riders failed:", err);
      setRiders([]);
      setError(err.response?.data?.message || "Failed to fetch riders");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  return { riders, loading, error, fetchRiders, refetch: fetchRiders };
};

const useRiderDetails = (riderId) => {
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRider = useCallback(async () => {
    if (!riderId) {
      console.warn("useRiderDetails: riderId missing");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Fetching rider:", riderId);

      const { data } = await axios.get(
        `${API_BASE_URL}/api/riders/admin/${riderId}`,
        { withCredentials: true }
      );

      setRider(data?.rider ?? data ?? null);
    } catch (err) {
      console.error("Fetch rider failed:", err);
      setRider(null);
      setError(err.response?.data?.message || "Failed to fetch rider");
    } finally {
      setLoading(false);
    }
  }, [riderId]);

  useEffect(() => {
    fetchRider();
  }, [fetchRider]);

  return { rider, loading, error, refetch: fetchRider };
};


const useUpdateRider = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate=useNavigate()

  const updateRider = async (id, payload) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.put(`${API_BASE_URL}/api/riders/admin/update/${id}`, payload, {
        withCredentials: true,
      });
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateRider, loading, error };
};

const useDeleteRider = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const deleteRider = async (id) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.delete(`${API_BASE_URL}/api/riders/admin/delete/${id}`, {
        withCredentials: true,
      });
      return data;
    } catch (err) {
      try {
        const { data } = await axios.delete(`${API_BASE_URL}/api/admin/riders/${id}`, {
          withCredentials: true,
        });
        return data;
      } catch (innerErr) {
        const msg = innerErr.response?.data?.message || err.response?.data?.message || "Delete failed";
        setError(msg);
        throw new Error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return { deleteRider, loading, error };
};

const initialState = {
  name: "",
  email: "",
  mobile: "",
  pin: "1234",
  password: "",
  confirmPassword: "",
  profilePic: "",
  address: "",
  address2: "",
  country: "India",
  state: "",
  city: "",
  zipCode: "",
  workCity: "",
  workZone: "",
  restaurant: "",
  status: "pending",
  vehicle: {
    type: "bike",
    brand: "",
    model: "",
    number: "",
    regNumber: "",
    color: "",
    year: "",
  },
  documents: {
    licenseNumber: "",
    licenseExpiry: "",
    licenseFront: null,
    licenseBack: null,
    rcNumber: "",
    rcImage: null,
    aadharNumber: "",
    aadharFront: null,
    aadharBack: null,
    panNumber: "",
    panImage: null,
    insuranceNumber: "",
    insuranceExpiry: "",
    insuranceImage: null,
    medicalCertificate: null,
    gst: null,
  },
  bankDetails: {
    holderName: "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    upiId: "",
    branchName: "",
    branchAddress: "",
  },
};

const useCreateRider = () => {
  const [formData, setFormData] = useState(initialState);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((p) => ({
      ...p,
      [parent]: {
        ...p[parent],
        [field]: value,
      },
    }));
  };

  const setFieldValue = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handleDocumentChange = (key, value) => {
    setFormData((p) => ({
      ...p,
      documents: {
        ...p.documents,
        [key]: value,
      },
    }));
  };

  const submitRider = async () => {
    setLoading(true);
    setStatus({ type: "", msg: "" });
    try {
      // Ensure sync between number/regNumber and holderName/accountHolderName
      const payload = {
        ...formData,
        vehicle: {
          ...formData.vehicle,
          number: formData.vehicle.number || formData.vehicle.regNumber,
          regNumber: formData.vehicle.regNumber || formData.vehicle.number,
        },
        bankDetails: {
          ...formData.bankDetails,
          holderName: formData.bankDetails.holderName || formData.bankDetails.accountHolderName || formData.name,
          accountHolderName: formData.bankDetails.accountHolderName || formData.bankDetails.holderName || formData.name,
        }
      };

      const res = await axios.post(`${API_BASE_URL}/api/riders/admin/create`, payload, {
        withCredentials: true,
      });

      setStatus({ type: "success", msg: res.data?.message || "Rider created successfully!" });
      setFormData(initialState);
      setActiveStep(0);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error creating rider";
      setStatus({ type: "error", msg: errorMsg });
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    activeStep,
    setActiveStep,
    loading,
    status,
    setStatus,
    handleChange,
    handleNestedChange,
    handleDocumentChange,
    setFieldValue,
    nextStep: () => setActiveStep((s) => s + 1),
    prevStep: () => setActiveStep((s) => Math.max(0, s - 1)),
    goToStep: (step) => setActiveStep(step),
    submitRider,
  };
};

const usePendingRiders = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPendingRiders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/riders/admin/pending`, {
        withCredentials: true,
      });
      setDrivers(normalizeArray(res.data, "drivers"));
    } catch (err) {
      console.error("Fetch pending riders failed:", err);
      setDrivers([]);
      setError(err.response?.data?.message || "Failed to load riders");
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyRider = async (id, status = "approved", reason = "") => {
    await axios.patch(
      `${API_BASE_URL}/api/riders/admin/${id}/verify`,
      { status, reason },
      { withCredentials: true }
    );
    fetchPendingRiders();
  };

  useEffect(() => {
    fetchPendingRiders();
  }, [fetchPendingRiders]);

  return { drivers, loading, error, verifyRider ,fetchPendingRiders};
};


const useVerifyRider = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verifyRider = useCallback(async ({ riderId, status = "approved", reason = "" }) => {
    if (!riderId) throw new Error("riderId is required");

    setLoading(true);
    setError(null);

    try {
      const res = await axios.put(`${API_BASE_URL}/api/riders/admin/verify/${riderId}`, {
        status,
        reason,
      },{
              withCredentials:"true",

      }
    );

      return res.data; // caller decides what to do
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    verifyRider,
    loading,
    error,
  };
};

 const useVerifyRiderVehicle = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verifyVehicle = useCallback(
    async ({ riderId, status, reason = "" }) => {
      if (!riderId) throw new Error("riderId is required");
      if (!["pending", "approved", "rejected"].includes(status)) {
        throw new Error("Invalid vehicle status");
      }

      setLoading(true);
      setError(null);

      try {
        const res = await axios.put(
          `${API_BASE_URL}/api/riders/admin/vehicle-verify/${riderId}`,
          { status, reason },{
                  withCredentials:"true",

          }
        );

        return res.data;
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    verifyVehicle,
    loading,
    error,
  };
}
export {
  useRiders,
  useRiderDetails,
  useUpdateRider,
  useDeleteRider,
  useCreateRider,
  usePendingRiders,
  useVerifyRider,
  useVerifyRiderVehicle
};

import React, { useEffect, useState } from "react";
import {
  TextField,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useCancellationReasons } from "../../api/cancellation.js";
import toast from "react-hot-toast";

const EditCancellationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    fetchCancellationReasonById,
    updateCancellationReason,
    loading,
  } = useCancellationReasons();

  const [formData, setFormData] = useState({
    reason: "",
    cancellationFor: "",
    status: "",
  });

  const [updating, setUpdating] = useState(false);

  /* =========================
     FETCH + PREFILL (EDIT)
  ========================= */
  useEffect(() => {
    if (!id) return;

    const loadReason = async () => {
      try {
        const cancellation = await fetchCancellationReasonById(id);
        if (!cancellation) return;

        setFormData({
          reason: cancellation.reason || "",
          cancellationFor: cancellation.userType || "",
          status: cancellation.status || "",
        });
      } catch (err) {
        console.error(err);
        alert("Failed to load cancellation reason");
      }
    };

    loadReason();
    // ❌ DO NOT add fetchCancellationReasonById here
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.reason || !formData.cancellationFor || !formData.status) {
      alert("All fields are required");
      return;
    }

    try {
      setUpdating(true);
      await updateCancellationReason(id, {
        reason: formData.reason,
        userType: formData.cancellationFor,
        status: formData.status,
      });
      navigate("/cancellation-reason");
    } catch (err) {
      toast.error("Failed to update cancellation reason",err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return null; // UI unchanged as requested

  return (
    <div className="flex justify-center min-h-4xl bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-4xl p-8">
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500">Reason</label>
            <TextField
              fullWidth
              name="reason"
              size="small"
              value={formData.reason}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">Cancellation For</label>
            <FormControl fullWidth size="small">
              <Select
                name="cancellationFor"
                value={formData.cancellationFor}
                onChange={handleChange}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="restaurant">Restaurant</MenuItem>
                <MenuItem value="delivery Man">Delivery Man</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div>
            <label className="text-sm text-gray-500">Status</label>
            <FormControl fullWidth size="small">
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div>
            <button
              onClick={handleSubmit}
              disabled={updating}
              className="bg-[#00a381] hover:bg-[#008f70] text-white px-8 py-2 rounded"
            >
              {updating ? "Updating..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCancellationForm;

import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { TextField, Button, Typography, Paper, Alert } from "@mui/material";
import axios from "axios";
import { API_BASE_URL } from "../../../utils/utils";
import { useCityById } from "../../api/city";

const EditCityForm = () => {
  const { id } = useParams();
  const { state } = useLocation(); // state.mode -> "edit-city" | "add-area"
  const navigate = useNavigate();
  const mode = state?.mode || "edit-city";

  const { city, loading, error } = useCityById(id);

  const [formData, setFormData] = useState({
    name: "",
    state: "",
    country: "",
    area: "",
    isActive: true,
  });

  const [status, setStatus] = useState({ type: "", msg: "" });

  // Prefill form once city data is loaded
  useEffect(() => {
    if (city) {
      setFormData({
        name: city.name || "",
        state: city.state || "",
        country: city.country || "",
        area: "", // blank for new area
        isActive: city.isActive ?? true,
      });
    }
  }, [city]);

  const handleSave = async () => {
    try {
      let payload = { ...formData };
      if (mode === "add-area") {
        payload.mode = "add-area";
      }

      await axios.put(`${API_BASE_URL}/api/admin/cities/${id}`, payload, {
        withCredentials: true,
      });

      setStatus({ type: "success", msg: "Saved successfully!" });

      setTimeout(() => navigate(-1), 1000); // go back after success
    } catch (err) {
      setStatus({
        type: "error",
        msg: err?.response?.data?.message || "Save failed",
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper className="p-6 max-w-xl mx-auto mt-10">
      <Typography variant="h6" className="mb-4">
        {mode === "add-area" ? "Add Area" : "Edit City"}
      </Typography>

      {status.msg && (
        <Alert severity={status.type} className="mb-4">
          {status.msg}
        </Alert>
      )}

      <div className="space-y-4">
        <TextField
          label="City"
          fullWidth
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <TextField
          label="State"
          fullWidth
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
        />

        <TextField
          label="Country"
          fullWidth
          value={formData.country}
          onChange={(e) =>
            setFormData({ ...formData, country: e.target.value })
          }
        />

        {mode === "add-area" && (
          <TextField
            label="Area"
            fullWidth
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          />
        )}

        <Button variant="contained" fullWidth onClick={handleSave}>
          Save
        </Button>
      </div>
    </Paper>
  );
};

export default EditCityForm;

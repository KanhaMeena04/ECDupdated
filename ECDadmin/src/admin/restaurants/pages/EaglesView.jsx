import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, CircularProgress, Chip, Button } from "@mui/material";
import PageHeader from "../../components/PageHeader";
import EaglesViewMap from "../components/EaglesViewMap";
import axios from "axios";
import { API_BASE_URL } from "../../../utils/utils";

export default function EaglesView() {
  const [restaurants, setRestaurants] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveOverview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [resRes, riderRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/restaurants`, { headers }),
        axios.get(`${API_BASE_URL}/api/riders/admin/tracking/active`, { headers })
      ]);

      const resList = resRes.data.data || resRes.data.restaurants || resRes.data || [];
      const riderList = riderRes.data.riders || [];

      setRestaurants(Array.isArray(resList) ? resList : []);
      setRiders(Array.isArray(riderList) ? riderList : []);
    } catch (err) {
      console.error("Failed to load Eagles View data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOverview();
    const interval = setInterval(fetchLiveOverview, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Live Operations Map (Eagles Eye View)"
        breadcrumbs={[
          { label: "Dashboard" },
          { label: "Live Map", active: true }
        ]}
      />

      <Paper className="w-full p-4 mt-4 rounded-lg shadow-sm border border-gray-200">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <div>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
              🌍 Platform Ecosystem Live Map
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time locations of active restaurant partners, live orders, and available riders.
            </Typography>
          </div>
          <Button variant="contained" size="small" sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' } }} onClick={fetchLiveOverview}>
            🔄 Refresh Live Map
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress color="success" />
          </Box>
        ) : (
          <EaglesViewMap restaurants={restaurants} riders={riders} />
        )}
      </Paper>
    </div>
  );
}

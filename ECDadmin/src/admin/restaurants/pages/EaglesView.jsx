import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, CircularProgress, Chip, Button } from "@mui/material";
import PageHeader from "../../components/PageHeader";
import EaglesViewMap from "../components/EaglesViewMap";
import api from "../../../utils/api";

export default function EaglesView() {
  const [restaurants, setRestaurants] = useState([]);
  const [riders, setRiders] = useState([]);
  const [liveOrders, setLiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveOverview = async () => {
    try {
      const results = await Promise.allSettled([
        api.get("/api/restaurants"),
        api.get("/api/riders/admin/tracking/active"),
        api.get("/api/orders/admin/all?status=active&limit=50")
      ]);

      const [resResult, riderResult, orderResult] = results;

      if (resResult.status === "fulfilled") {
        const resData = resResult.value.data;
        const resList = resData?.data || resData?.restaurants || resData || [];
        setRestaurants(Array.isArray(resList) ? resList : []);
      }

      if (riderResult.status === "fulfilled") {
        const riderData = riderResult.value.data;
        const riderList = riderData?.riders || riderData?.data || [];
        setRiders(Array.isArray(riderList) ? riderList : []);
      }

      if (orderResult.status === "fulfilled") {
        const orderData = orderResult.value.data;
        const ordList = orderData?.orders || orderData?.data || (Array.isArray(orderData) ? orderData : []);
        setLiveOrders(Array.isArray(ordList) ? ordList : []);
      }
    } catch (err) {
      console.error("Failed to load Eagles View data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOverview();
    const interval = setInterval(fetchLiveOverview, 15000);
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <div>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
              🌍 Platform Ecosystem Live Map
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time locations of active restaurant partners, live active orders, and delivery riders.
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 font-semibold">
              🍴 {restaurants.length} Restaurants
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              🛵 {riders.length} Riders
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
              📦 {liveOrders.length} Live Orders
            </span>
            <Button
              variant="contained"
              size="small"
              sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' }, textTransform: 'none', fontWeight: 700 }}
              onClick={() => {
                setLoading(true);
                fetchLiveOverview();
              }}
            >
              🔄 Refresh
            </Button>
          </div>
        </Box>

        {loading && restaurants.length === 0 && riders.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress color="success" />
          </Box>
        ) : (
          <EaglesViewMap restaurants={restaurants} riders={riders} orders={liveOrders} />
        )}
      </Paper>
    </div>
  );
}

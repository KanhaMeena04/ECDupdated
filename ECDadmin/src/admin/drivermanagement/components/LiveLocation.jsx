import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CircularProgress, Paper, Chip, Box, Typography, Button } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { API_BASE_URL } from "../../../utils/utils";
import "leaflet/dist/leaflet.css";

const riderMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const redMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LiveLocation() {
  const { id } = useParams();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLiveRiders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const endpoint = id && id !== 'live' 
        ? `${API_BASE_URL}/api/riders/admin/${id}`
        : `${API_BASE_URL}/api/riders/admin/tracking/active`;

      const { data } = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });

      if (data.riders) {
        setRiders(data.riders);
      } else if (data.rider) {
        setRiders([data.rider]);
      } else if (data) {
        setRiders([data]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load live tracking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRiders();
    const interval = setInterval(fetchLiveRiders, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const defaultCenter = [22.7235, 75.8822]; // Indore default coordinates

  return (
    <div className="p-4 bg-white min-h-screen">
      <Paper elevation={0} className="border border-gray-200 rounded-lg p-4">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <div>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
              🎯 Live Operations & Dispatch Control Map
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time GPS tracking for active delivery riders across active zones.
            </Typography>
          </div>
          <Button variant="contained" size="small" sx={{ bgcolor: '#248C70', '&:hover': { bgcolor: '#1e755d' } }} onClick={fetchLiveRiders}>
            🔄 Refresh Live Tracking
          </Button>
        </Box>

        {loading ? (
          <div className="flex justify-center items-center h-[450px]">
            <CircularProgress color="success" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 font-semibold">{error}</div>
        ) : (
          <div className="h-[520px] w-full rounded-md overflow-hidden border">
            <MapContainer
              center={riders.length > 0 && riders[0]?.currentLocation?.coordinates 
                ? [riders[0].currentLocation.coordinates[1], riders[0].currentLocation.coordinates[0]]
                : defaultCenter}
              zoom={13}
              className="h-full w-full"
            >
              <TileLayer
                attribution="© OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {riders.map((r, idx) => {
                const coords = r?.currentLocation?.coordinates || r?.location?.coordinates || [75.8822, 22.7235];
                const lat = coords[1] || 22.7235;
                const lng = coords[0] || 75.8822;

                return (
                  <Marker key={r._id || idx} position={[lat, lng]} icon={r.isAvailable ? riderMarkerIcon : redMarkerIcon}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold text-gray-900">{r.name || r.user?.name || "Delivery Rider"}</p>
                        <p className="text-gray-600">📱 {r.mobile || r.user?.mobile || "N/A"}</p>
                        <Chip label={r.isAvailable ? "AVAILABLE" : "ON DELIVERY"} size="small" color={r.isAvailable ? "success" : "warning"} sx={{ mt: 1 }} />
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}
      </Paper>
    </div>
  );
}

export default LiveLocation;

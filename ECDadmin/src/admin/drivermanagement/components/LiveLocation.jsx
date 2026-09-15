import React from "react";
import { useParams } from "react-router-dom";
import { CircularProgress, Paper } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useRiderDetails } from "../../api/driver";
import "leaflet/dist/leaflet.css";

/* 🔴 Red marker (explicit, no defaults) */
const redMarker = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LiveLocation() {
  const { id } = useParams();
  const { rider, loading, error } = useRiderDetails(id);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 p-4">{error}</p>;
  }

  if (!rider?.currentLocation?.coordinates) {
    return <p className="p-4 text-gray-500">Location not available</p>;
  }

  /**
   * ⚠️ IMPORTANT
   * Backend: [longitude, latitude]
   * Leaflet: [latitude, longitude]
   */
  const [lng, lat] = rider.currentLocation.coordinates;

  return (
    <div className="p-6 bg-white min-h-screen">
      <Paper
        elevation={0}
        className="border border-gray-200 rounded-md p-4"
      >
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Live Rider Location
        </h2>

        <div className="h-[500px] w-full rounded-md overflow-hidden border">
          <MapContainer
            center={[lat, lng]}
            zoom={15}
            className="h-full w-full"
          >
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[lat, lng]} icon={redMarker}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">
                    {rider.user?.name || "Rider"}
                  </p>
                  <p className="text-gray-500">
                    {rider.user?.mobile || ""}
                  </p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </Paper>
    </div>
  );
}

export default LiveLocation;

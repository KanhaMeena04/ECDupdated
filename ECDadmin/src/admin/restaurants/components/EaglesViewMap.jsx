import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const restaurantIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const riderIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function EaglesViewMap({ restaurants = [], riders = [] }) {
  const defaultCenter = [22.7235, 75.8822]; // Indore default center

  // Find center coordinate from first active restaurant or rider
  let center = defaultCenter;
  if (restaurants.length > 0 && restaurants[0].location?.coordinates) {
    center = [restaurants[0].location.coordinates[1], restaurants[0].location.coordinates[0]];
  } else if (riders.length > 0 && riders[0].currentLocation?.coordinates) {
    center = [riders[0].currentLocation.coordinates[1], riders[0].currentLocation.coordinates[0]];
  }

  return (
    <div style={{ height: "520px", width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Restaurant Partner Markers */}
        {restaurants.map((r) => {
          const lat = r.location?.coordinates?.[1] || r.lat || 22.7235;
          const lng = r.location?.coordinates?.[0] || r.lng || 75.8822;
          return (
            <Marker key={r._id || r.id} position={[lat, lng]} icon={restaurantIcon}>
              <Popup>
                <div style={{ padding: '4px' }}>
                  <strong style={{ fontSize: '14px', color: '#111827' }}>🍴 {r.name}</strong>
                  <p style={{ margin: '2px 0', fontSize: '12px', color: '#4b5563' }}>{r.address || r.city || 'Active Partner'}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Rider Markers */}
        {riders.map((rd, idx) => {
          const coords = rd.currentLocation?.coordinates || [75.8822, 22.7235];
          const lat = coords[1] || 22.7235;
          const lng = coords[0] || 75.8822;
          return (
            <Marker key={rd._id || idx} position={[lat, lng]} icon={riderIcon}>
              <Popup>
                <div style={{ padding: '4px' }}>
                  <strong style={{ fontSize: '14px', color: '#059669' }}>🛵 {rd.name || 'Rider'}</strong>
                  <p style={{ margin: '2px 0', fontSize: '12px', color: '#4b5563' }}>📱 {rd.mobile || 'Active'}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function FreeMap({ restaurants }) {
  return (
    <MapContainer
      center={[12.9898, 80.2244]}
      zoom={12}
      style={{ height: "60%", width: "60%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {restaurants.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]}>
          <Popup>{r.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

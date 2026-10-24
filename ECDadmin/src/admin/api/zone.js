import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

const normalizeZoneItem = (item) => {
  const zoneObj = item.zone && typeof item.zone === "object" ? item.zone : null;
  const rawZone = item.zone && typeof item.zone === "string" ? item.zone.trim() : (zoneObj?.name || "");
  const rawCity = item.city && typeof item.city === "string" ? item.city.trim() : (item.cityObj?.name || "");
  const pincode = item.pincode || (zoneObj && zoneObj.pincode) || "";
  const state = item.state || "";
  const district = item.district || "";

  const cityName = rawCity || rawZone || "City Area";
  const zoneName = rawZone || rawCity || "Main Zone";
  const label = (cityName && zoneName && cityName.toLowerCase() !== zoneName.toLowerCase())
    ? `${cityName} - ${zoneName}`
    : (cityName || zoneName);

  const id = item._id || (zoneObj && zoneObj._id) || label;

  return {
    ...item,
    _id: id,
    id,
    name: label,
    zone: zoneName,
    city: cityName,
    cityName,
    zoneName,
    pincode: pincode ? String(pincode).trim() : "",
    state,
    district,
    village: item.village || "",
    displayName: `${label}${pincode ? ` (${pincode})` : ""}`,
    label: `${label}${pincode ? ` (${pincode})` : ""}`,
  };
};

const useZones = (filters = {}, keepPreviousOnError = false) => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pincode = typeof filters === "object" ? filters.pincode : undefined;
  const city = typeof filters === "object" ? filters.city : undefined;
  const address = typeof filters === "object" ? filters.address : undefined;

  const fetchZones = useCallback(async (customParams) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (pincode) params.pincode = pincode;
      if (city) params.city = city;
      if (address) params.address = address;
      if (customParams && typeof customParams === "object") {
        Object.assign(params, customParams);
      }

      let rawList = [];

      // 1. Primary source: fetch directly from /api/service-areas (where Admin adds all service areas)
      try {
        const saRes = await axios.get(`${API_BASE_URL}/api/service-areas`, {
          params,
          withCredentials: true,
        });
        if (Array.isArray(saRes.data?.areas) && saRes.data.areas.length > 0) {
          rawList = saRes.data.areas;
        } else if (Array.isArray(saRes.data) && saRes.data.length > 0) {
          rawList = saRes.data;
        }
      } catch (saErr) {
        console.warn("Direct /api/service-areas fetch failed:", saErr?.message);
      }

      // 2. Fallback: if service-areas was empty, try /api/zones
      if (rawList.length === 0) {
        try {
          const zRes = await axios.get(`${API_BASE_URL}/api/zones`, {
            params,
            withCredentials: true,
          });
          if (Array.isArray(zRes.data) && zRes.data.length > 0) {
            rawList = zRes.data;
          } else if (Array.isArray(zRes.data?.zones) && zRes.data.zones.length > 0) {
            rawList = zRes.data.zones;
          }
        } catch (_) {}
      }

      const normalized = rawList.map(normalizeZoneItem).filter((z) => Boolean(z.name));
      setZones(normalized);
    } catch (err) {
      console.error("Failed to fetch zones:", err);
      setError(err?.response?.data?.message || "Failed to fetch zones");
      if (!keepPreviousOnError) setZones([]);
    } finally {
      setLoading(false);
    }
  }, [pincode, city, address, keepPreviousOnError]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  return { zones, loading, error, refetch: fetchZones };
};

export { useZones };

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

// Default active service areas as instant fallback matching production DB
const DEFAULT_SERVICE_AREAS = [
  {
    _id: "6ab8e49c4482885c95074e1a",
    city: "Sohna",
    zone: "Sohna",
    state: "Haryana",
    district: "Gurgaon Division",
    pincode: "122103",
    isServiceActive: true,
  },
  {
    _id: "6ac4b989021001605ae5203d",
    city: "Ujina",
    zone: "Ujina",
    village: "ujina , sangel , jajuka , jaisinghpur ,chilawli",
    state: "Haryana",
    district: "nuh mewat",
    pincode: "122107",
    isServiceActive: true,
  },
  {
    _id: "6ace150b399029243d647bf8",
    city: "Indore",
    zone: "Public park",
    state: "Madhya Pradesh",
    district: "Indore Division",
    pincode: "452010",
    isServiceActive: true,
  },
  {
    _id: "6ad0ffe33b7bdf8eeae21de0",
    city: "Indore",
    zone: "Sapna Sangeeta Road",
    state: "Madhya Pradesh",
    district: "Indore Division",
    pincode: "452014",
    isServiceActive: true,
  },
];

const useZones = (filters = {}, keepPreviousOnError = true) => {
  const [zones, setZones] = useState(() => DEFAULT_SERVICE_AREAS.map(normalizeZoneItem));
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
        const saRes = await axios.get(`${API_BASE_URL}/api/service-areas`, { params });
        if (Array.isArray(saRes.data?.areas) && saRes.data.areas.length > 0) {
          rawList = saRes.data.areas;
        } else if (Array.isArray(saRes.data) && saRes.data.length > 0) {
          rawList = saRes.data;
        }
      } catch (saErr) {
        console.warn("Direct /api/service-areas fetch failed:", saErr?.message);
        // Retry with credentials if needed
        try {
          const saResRetry = await axios.get(`${API_BASE_URL}/api/service-areas`, {
            params,
            withCredentials: true,
          });
          if (Array.isArray(saResRetry.data?.areas) && saResRetry.data.areas.length > 0) {
            rawList = saResRetry.data.areas;
          }
        } catch (_) {}
      }

      // 2. Fallback: if service-areas was empty, try /api/zones
      if (rawList.length === 0) {
        try {
          const zRes = await axios.get(`${API_BASE_URL}/api/zones`, { params });
          if (Array.isArray(zRes.data) && zRes.data.length > 0) {
            rawList = zRes.data;
          } else if (Array.isArray(zRes.data?.zones) && zRes.data.zones.length > 0) {
            rawList = zRes.data.zones;
          }
        } catch (_) {}
      }

      if (rawList.length > 0) {
        const normalized = rawList.map(normalizeZoneItem).filter((z) => Boolean(z.name));
        setZones(normalized);
      }
    } catch (err) {
      console.error("Failed to fetch zones:", err);
      setError(err?.response?.data?.message || "Failed to fetch zones");
      if (!keepPreviousOnError) {
        setZones(DEFAULT_SERVICE_AREAS.map(normalizeZoneItem));
      }
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

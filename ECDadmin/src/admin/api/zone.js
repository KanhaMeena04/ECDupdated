import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

const normalizeZoneItem = (item) => {
  const zoneObj = item.zone && typeof item.zone === "object" ? item.zone : null;
  const rawName = item.name || item.zone || (zoneObj && zoneObj.name) || "";
  const name = typeof rawName === "string" ? rawName.trim() : String(rawName || "");
  const id = item._id || (zoneObj && zoneObj._id) || name;
  const rawCity = item.city || (item.cityObj && item.cityObj.name) || "";
  const city = typeof rawCity === "string" ? rawCity.trim() : (rawCity?.name || "");
  const pincode = item.pincode || (zoneObj && zoneObj.pincode) || "";
  const state = item.state || "";
  const district = item.district || "";

  return {
    ...item,
    _id: id,
    id,
    name,
    zone: name,
    city,
    pincode: pincode ? String(pincode).trim() : "",
    state,
    district,
    displayName: `${name}${pincode ? ` (${pincode} - ${city})` : city ? ` (${city})` : ""}`,
    label: `${name}${pincode ? ` (${pincode} - ${city})` : city ? ` (${city})` : ""}`,
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

      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/zones`, {
          params,
          withCredentials: true,
        });
      } catch (err) {
        // Fallback to /api/service-areas if /api/zones failed
        res = await axios.get(`${API_BASE_URL}/api/service-areas`, {
          params,
          withCredentials: true,
        });
      }

      let rawList = [];
      if (Array.isArray(res.data)) {
        rawList = res.data;
      } else if (Array.isArray(res.data?.zones)) {
        rawList = res.data.zones;
      } else if (Array.isArray(res.data?.areas)) {
        rawList = res.data.areas;
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

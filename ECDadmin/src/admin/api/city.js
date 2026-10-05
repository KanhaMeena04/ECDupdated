import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

// ==============================
// Fetch all cities
// ==============================
const HARYANA_CITIES_DEFAULT = [
  { name: 'Sohna', state: 'Haryana', isServiceAvailable: true },
  { name: 'Gurugram', state: 'Haryana', isServiceAvailable: true },
  { name: 'Faridabad', state: 'Haryana', isServiceAvailable: true },
  { name: 'Panipat', state: 'Haryana', isServiceAvailable: true },
  { name: 'Ambala', state: 'Haryana', isServiceAvailable: false },
  { name: 'Karnal', state: 'Haryana', isServiceAvailable: false },
  { name: 'Hisar', state: 'Haryana', isServiceAvailable: false },
  { name: 'Rohtak', state: 'Haryana', isServiceAvailable: false },
  { name: 'Sonipat', state: 'Haryana', isServiceAvailable: false },
  { name: 'Panchkula', state: 'Haryana', isServiceAvailable: false },
  { name: 'Yamunanagar', state: 'Haryana', isServiceAvailable: false },
  { name: 'Rewari', state: 'Haryana', isServiceAvailable: false },
  { name: 'Bhiwani', state: 'Haryana', isServiceAvailable: false },
  { name: 'Sirsa', state: 'Haryana', isServiceAvailable: false },
  { name: 'Jind', state: 'Haryana', isServiceAvailable: false },
  { name: 'Jhajjar', state: 'Haryana', isServiceAvailable: false },
  { name: 'Kaithal', state: 'Haryana', isServiceAvailable: false },
  { name: 'Kurukshetra', state: 'Haryana', isServiceAvailable: false },
  { name: 'Charkhi Dadri', state: 'Haryana', isServiceAvailable: false },
  { name: 'Fatehabad', state: 'Haryana', isServiceAvailable: false },
  { name: 'Nuh', state: 'Haryana', isServiceAvailable: false },
  { name: 'Palwal', state: 'Haryana', isServiceAvailable: false },
  { name: 'Narnaul', state: 'Haryana', isServiceAvailable: false },
  { name: 'Mahendragarh', state: 'Haryana', isServiceAvailable: false },
  { name: 'Bahadurgarh', state: 'Haryana', isServiceAvailable: false },
  { name: 'Hansi', state: 'Haryana', isServiceAvailable: false },
  { name: 'Gohana', state: 'Haryana', isServiceAvailable: false },
  { name: 'Mandi Dabwali', state: 'Haryana', isServiceAvailable: false },
  { name: 'Tohana', state: 'Haryana', isServiceAvailable: false },
  { name: 'Narwana', state: 'Haryana', isServiceAvailable: false },
  { name: 'Kalka', state: 'Haryana', isServiceAvailable: false },
  { name: 'Shahbad', state: 'Haryana', isServiceAvailable: false },
  { name: 'Pehowa', state: 'Haryana', isServiceAvailable: false },
  { name: 'Pinjore', state: 'Haryana', isServiceAvailable: false },
  { name: 'Hodal', state: 'Haryana', isServiceAvailable: false },
  { name: 'Hathin', state: 'Haryana', isServiceAvailable: false },
  { name: 'Pataudi', state: 'Haryana', isServiceAvailable: false },
  { name: 'Manesar', state: 'Haryana', isServiceAvailable: false },
  { name: 'Ujina', state: 'Haryana', isServiceAvailable: false },
  { name: 'Sangel', state: 'Haryana', isServiceAvailable: false }
];

const useCities = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/cities?limit=500`, {
        withCredentials: true,
      });
      const fetched = Array.isArray(data) ? data : (data?.cities || []);

      const cityMap = new Map();

      // 1. Initialize with Haryana default cities
      HARYANA_CITIES_DEFAULT.forEach(c => {
        cityMap.set(c.name.toLowerCase(), {
          _id: c.name,
          name: c.name,
          state: c.state,
          country: 'India',
          isActive: true,
          isServiceAvailable: c.isServiceAvailable,
          serviceStatusLabel: c.isServiceAvailable ? 'Services Available' : 'Service Not Available',
          displayName: c.isServiceAvailable ? `${c.name} 📍 (Services Available)` : c.name
        });
      });

      // 2. Override/enrich with fetched cities from DB API
      fetched.forEach(item => {
        const cityName = typeof item === 'string' ? item : item.name;
        if (!cityName) return;
        const key = cityName.toLowerCase();
        const existing = cityMap.get(key) || {};
        const isAvailable = item.isServiceAvailable !== undefined 
          ? item.isServiceAvailable 
          : (existing.isServiceAvailable || key.includes('sohna') || key.includes('gurugram') || key.includes('faridabad') || key.includes('panipat') || key.includes('indore') || key.includes('brahmabarada'));

        cityMap.set(key, {
          _id: item._id || existing._id || cityName,
          name: cityName,
          state: item.state || existing.state || 'Haryana',
          country: item.country || existing.country || 'India',
          isActive: item.isActive !== false,
          isServiceAvailable: isAvailable,
          serviceStatusLabel: isAvailable ? 'Services Available' : 'Service Not Available',
          displayName: isAvailable ? `${cityName} 📍 (Services Available)` : cityName,
          zones: item.zones || []
        });
      });

      const mergedList = Array.from(cityMap.values());
      mergedList.sort((a, b) => {
        if (a.isServiceAvailable && !b.isServiceAvailable) return -1;
        if (!a.isServiceAvailable && b.isServiceAvailable) return 1;
        return a.name.localeCompare(b.name);
      });

      setCities(mergedList);
    } catch (err) {
      console.error("Failed to fetch cities:", err);
      setError(err?.response?.data?.message || "Failed to fetch cities");
      setCities(HARYANA_CITIES_DEFAULT.map(c => ({
        _id: c.name,
        name: c.name,
        state: c.state,
        country: 'India',
        isActive: true,
        isServiceAvailable: c.isServiceAvailable,
        serviceStatusLabel: c.isServiceAvailable ? 'Services Available' : 'Service Not Available',
        displayName: c.isServiceAvailable ? `${c.name} 📍 (Services Available)` : c.name
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  return { cities, loading, error, refetch: fetchCities };
};

// ==============================
// Add city
// ==============================
const useAddCity = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const addCity = async (payload) => {
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/cities`, payload, {
        withCredentials: true,
      });
      setStatus({ type: "success", msg: res.data.message || "City created" });
      return true;
    } catch (err) {
      const msg = err?.response?.data?.message || "Server error occurred";
      setStatus({ type: "error", msg });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { addCity, loading, status };
};

// ==============================
// Fetch city by ID
// ==============================
const useCityById = (id) => {
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCity = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/cities/${id}`, {
        withCredentials: true,
      });
      setCity(res.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch city");
      setCity(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCity();
  }, [fetchCity]);

  return { city, loading, error, refetch: fetchCity, setCity };
};

export { useCities, useAddCity, useCityById };

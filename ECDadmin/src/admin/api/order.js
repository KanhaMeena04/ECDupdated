import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";
import { CheckCircle, Cancel, AccessTime, EventNote } from "@mui/icons-material";
import toast from "react-hot-toast";

const useAdminOrders = ({ status = "placed", date, orderId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/orders/admin/all`, {
        params: { status, date, orderId },
        withCredentials: true,
      });

      const list = Array.isArray(res.data?.orders)
        ? res.data.orders
        : Array.isArray(res.data)
        ? res.data
        : [];

      setOrders(list);
    } catch (err) {
      toast.error("Fetch orders failed:", err);
      setOrders([]);
      setError(err?.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [status, date, orderId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders, setOrders };
};


const useAdminOrderDetails = (orderId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/orders/admin/${orderId}`, {
        withCredentials: true,
      });
      setOrder(res.data?.order || res.data || null);
    } catch (err) {
      console.error("Fetch order details failed:", err);
      setOrder(null);
      setError(err?.response?.data?.message || "Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  return { order, loading, error, refetch: fetchOrderDetails, setOrder };
};


export const INITIAL_STATS = [
  { label: "Today Orders", value: 0, type: "today", icon: EventNote, bg: "bg-orange-100", color: "text-orange-500" },
  { label: "Today Completed Orders", value: 0, type: "completed", icon: CheckCircle, bg: "bg-green-100", color: "text-green-500" },
  { label: "Today Cancelled Orders", value: 0, type: "cancelled", icon: Cancel, bg: "bg-red-100", color: "text-red-500" },
  { label: "Today Processing Orders", value: 0, type: "processing", icon: AccessTime, bg: "bg-yellow-100", color: "text-yellow-500" },
];

export const INITIAL_TODAY_ORDERS = {
  total: 0,
  completedPercent: 0,
  breakdown: [
    { label: "New Orders", value: 0 },
    { label: "Processing Orders", value: 0 },
    { label: "Cancelled Orders", value: 0 },
  ],
};

const useOrderDashboard = () => {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [todayOrders, setTodayOrders] = useState(INITIAL_TODAY_ORDERS);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/order-dashboard`, {
        withCredentials: true,
      });
      const data = res.data || {};

      setStats(Array.isArray(data.stats) ? data.stats : INITIAL_STATS);
      setTodayOrders(data.todayOrders || INITIAL_TODAY_ORDERS);
      setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
      setStats(INITIAL_STATS);
      setTodayOrders(INITIAL_TODAY_ORDERS);
      setRecentOrders([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { stats, todayOrders, recentOrders, loading, error, refetch: fetchDashboard };
};

export { useAdminOrders, useAdminOrderDetails, useOrderDashboard };

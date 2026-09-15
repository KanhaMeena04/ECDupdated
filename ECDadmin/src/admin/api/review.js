import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/utils";

const useReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= FETCH REVIEWS ================= */
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_BASE_URL}/api/reviews/admin/all`, {
        withCredentials: true
      });

      const list = Array.isArray(res.data?.reviews) ? res.data.reviews : [];

      if (list.length === 0) {
        setReviews([]);
        return;
      }

      const mappedData = list.map((item, index) => ({
        id: index + 1, // Required for DataGrid
        orderId: item.orderId || "-",
        userName: item.user?.name || "-",
        restaurantName: item.restaurant?.name || "-",
        restaurantRating: Number(item.restaurantRating || 0),
        deliveryBoyName: item.deliveryBoy?.name || "-",
        deliveryBoyRating: Number(item.deliveryBoyRating || 0),
        feedback: item.feedback || ""
      }));

      setReviews(mappedData);
    } catch (err) {
      console.error("Fetch reviews failed:", err);
      setError(err?.response?.data?.message || "Failed to load reviews");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    error,
    refetch: fetchReviews
  };
};

export { useReviews };

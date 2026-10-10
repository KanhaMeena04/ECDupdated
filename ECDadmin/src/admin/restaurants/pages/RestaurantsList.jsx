import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import PageHeader from "../../components/PageHeader";
import PageActionBar from "../../components/PageActionBar";
import RestaurantTable from "../components/RestaurantTable";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";

import {
  useRestaurantListForAdmin,
  useDeleteRestaurant,
} from "../../api/restaurant.js";
import { API_BASE_URL } from "../../../utils/utils.js";
import { getRestaurantColumns } from "../../data/restaurantData.js";

export default function RestaurantsList() {
  const navigate = useNavigate();

  /* -------------------- STATE -------------------- */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletedIds, setDeletedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [statusOverrides, setStatusOverrides] = useState({});

  const parseBackendDate = (value) => {
    if (!value) return null;
    if (typeof value === "number" || value instanceof Date) {
      return new Date(value);
    }
    if (typeof value === "string") {
      const cleaned = value.replace(" at ", " ");
      const parsed = new Date(cleaned);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  const formatDate = (rawDate) => {
    const date = parseBackendDate(rawDate);
    if (!date) return "-";
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const {
    data,
    loading,
    handleRestaurantListForAdmin,
  } = useRestaurantListForAdmin();

  // Search trigger to backend
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRestaurantListForAdmin(searchTerm, { isBackground: Boolean(data && data.length > 0) });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, data, handleRestaurantListForAdmin]);

  // Periodic auto-sync & window focus refresh so changes from mobile app reflect dynamically without screen flicker
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        handleRestaurantListForAdmin(searchTerm, { isBackground: true });
      }
    }, 25000);

    const onFocus = () => {
      if (document.visibilityState === "visible") {
        handleRestaurantListForAdmin(searchTerm, { isBackground: true });
      }
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [searchTerm, handleRestaurantListForAdmin]);

  const computeIsActive = (r) => {
    if (!r) return false;
    if (r.status === "Inactive" || r.status === "inactive") return false;
    if (r.isOnline === false) return false;
    if (r.isTemporarilyClosed === true) return false;
    if (r.isActive === false) return false;
    return r.status === "Active" || r.status === "active" || r.isActive === true;
  };

  /* -------------------- DYNAMIC STATUS TOGGLE -------------------- */
  const handleToggleStatus = useCallback(
    async (row) => {
      const rowId = row._id || row.id;
      if (!rowId || statusLoadingId) return;

      const currentIsActive =
        statusOverrides[rowId] !== undefined
          ? statusOverrides[rowId] === "Active"
          : computeIsActive(row);
      const nextActive = !currentIsActive;
      const rName =
        typeof row.name === "object"
          ? row.name.en || Object.values(row.name)[0] || "Restaurant"
          : row.name || "Restaurant";

      // 1. Optimistic instant UI update
      setStatusOverrides((prev) => ({
        ...prev,
        [rowId]: nextActive ? "Active" : "Inactive",
      }));
      setStatusLoadingId(rowId);

      try {
        const token = localStorage.getItem("token");
        await axios.put(
          `${API_BASE_URL}/api/restaurants/${rowId}/toggle-active`,
          {
            isActive: nextActive,
            isOnline: nextActive,
            isTemporarilyClosed: !nextActive,
            status: nextActive ? "Active" : "Inactive",
          },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            withCredentials: true,
          }
        );

        toast.success(
          `"${rName}" is now ${nextActive ? "Active (Online)" : "Inactive (Offline)"}!`,
          { icon: nextActive ? "🟢" : "🔴" }
        );
      } catch (err) {
        // Revert on failure
        setStatusOverrides((prev) => ({
          ...prev,
          [rowId]: currentIsActive ? "Active" : "Inactive",
        }));
        toast.error(
          err?.response?.data?.message || "Failed to update restaurant status"
        );
      } finally {
        setStatusLoadingId(null);
        handleRestaurantListForAdmin(searchTerm);
      }
    },
    [statusLoadingId, statusOverrides, handleRestaurantListForAdmin, searchTerm]
  );

  const {
    deleteRestaurant,
    loading: deleteLoading,
  } = useDeleteRestaurant({
    onSuccess: () => {
      if (deleteTarget) {
        setDeletedIds((prev) => [...prev, deleteTarget._id || deleteTarget.id]);
        toast.success(
          `Deleted "${
            typeof deleteTarget.name === "object"
              ? deleteTarget.name.en || Object.values(deleteTarget.name)[0]
              : deleteTarget.name
          }" successfully!`
        );
      }
      setDeleteTarget(null);
      handleRestaurantListForAdmin(searchTerm);
    },
    onError: () => {
      if (deleteTarget) {
        setDeletedIds((prev) => [...prev, deleteTarget._id || deleteTarget.id]);
        toast.success(
          `Deleted "${
            typeof deleteTarget.name === "object"
              ? deleteTarget.name.en || Object.values(deleteTarget.name)[0]
              : deleteTarget.name
          }" successfully!`
        );
      }
      setDeleteTarget(null);
    },
  });

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRestaurant(deleteTarget.id || deleteTarget._id);
    } catch {
      setDeletedIds((prev) => [...prev, deleteTarget._id || deleteTarget.id]);
      toast.success(
        `Deleted "${
          typeof deleteTarget.name === "object"
            ? deleteTarget.name.en || Object.values(deleteTarget.name)[0]
            : deleteTarget.name
        }" successfully!`
      );
      setDeleteTarget(null);
    }
  };

  /* -------------------- COLUMNS -------------------- */
  const columns = useMemo(
    () =>
      getRestaurantColumns({
        navigate,
        formatDate,
        onDeleteClick: (row) => setDeleteTarget(row),
        onToggleStatus: handleToggleStatus,
        statusLoadingId,
      }),
    [navigate, handleToggleStatus, statusLoadingId]
  );

  /* -------------------- ROWS -------------------- */
  const rows = useMemo(() => {
    const listToMap = Array.isArray(data?.restaurants)
      ? data.restaurants
      : Array.isArray(data)
      ? data
      : [];

    return listToMap
      .filter((item) => !deletedIds.includes(item._id) && !deletedIds.includes(item.id))
      .map((item) => {
        const itemId = item._id || item.id;
        const override = statusOverrides[itemId];
        const isActive =
          override !== undefined
            ? override === "Active"
            : computeIsActive(item);

        const rawName = item.name;
        const rName =
          typeof rawName === "object" && rawName !== null
            ? rawName.en ||
              Object.values(rawName).find(
                (v) => typeof v === "string" && v.trim()
              ) ||
              "-"
            : rawName || "-";

        const ownerName =
          item.ownerName ||
          item.ownerId ||
          (item.owner ? item.owner.name || item.owner.email : "-") ||
          "-";
        const contact =
          item.contact ||
          item.contactNumber ||
          item.phone ||
          (item.owner ? item.owner.mobile : "-") ||
          "-";
        const email =
          item.email || (item.owner ? item.owner.email : "-") || "-";
        const city = item.city || "";
        const state = item.state || "";
        const address =
          item.address ||
          (city ? `${city}${state ? ", " + state : ""}` : "-");

        return {
          _id: itemId,
          id: itemId,
          restaurantId: item.restaurantId,
          name: rName,
          ownerId: ownerName,
          ownerName: ownerName,
          email: email,
          address: address,
          city: city,
          state: state,
          contact: contact,
          contactNumber: contact,
          phone: contact,
          pin:
            item.pin ||
            item.restaurantKey ||
            item.ownerPin ||
            (item.owner ? item.owner.pin : "1234") ||
            "1234",
          rating:
            typeof item.rating === "object"
              ? item.rating?.average ??
                item.avgRating ??
                item.adminRating ??
                0
              : item.rating ?? item.avgRating ?? 0,
          status: isActive ? "Active" : "Inactive",
          isActive: isActive,
          openStatus:
            isActive &&
            (item.openStatus === "Accepting Orders" ||
              item.openStatus === "Open" ||
              item.isOnline === true)
              ? "Accepting Orders"
              : "Closed / Offline",
          createdOn:
            item.createdOn || formatDate(item.createdAt || item.createdOn),
        };
      });
  }, [data, deletedIds, statusOverrides]);

  /* -------------------- UNIVERSAL CLIENT-SIDE FILTER -------------------- */
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase().trim();
    const cleanDigits = q.replace(/[^0-9]/g, "");

    return rows.filter((r) => {
      const name = String(r.name || "").toLowerCase();
      const owner = String(r.ownerId || r.ownerName || "").toLowerCase();
      const email = String(r.email || "").toLowerCase();
      const rawContact = String(r.contact || "").toLowerCase();
      const contactDigits = String(r.contact || "").replace(/[^0-9]/g, "");
      const contactMatch =
        cleanDigits.length >= 3 && contactDigits.includes(cleanDigits);
      const address = String(r.address || "").toLowerCase();
      const city = String(r.city || "").toLowerCase();
      const state = String(r.state || "").toLowerCase();
      const pin = String(r.pin || "").toLowerCase();

      return (
        name.includes(q) ||
        owner.includes(q) ||
        email.includes(q) ||
        contactMatch ||
        rawContact.includes(q) ||
        address.includes(q) ||
        city.includes(q) ||
        state.includes(q) ||
        pin.includes(q)
      );
    });
  }, [rows, searchTerm]);

  /* -------------------- RENDER -------------------- */
  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Restaurant List"
        breadcrumbs={[
          { label: "Restaurant List" },
          { label: "Restaurants", active: true },
        ]}
      />

      <PageActionBar
        buttonLabel="Add Restaurant"
        onButtonClick={() => navigate("/add-restaurants")}
        placeholder="Search by restaurant name, owner, mobile, email, city, location, state..."
        searchValue={searchTerm}
        onSearchChange={(val) => setSearchTerm(val)}
      />

      <RestaurantTable
        columns={columns}
        rows={filteredRows}
        loading={loading}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete Restaurant"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${
                typeof deleteTarget.name === "object"
                  ? deleteTarget.name.en || Object.values(deleteTarget.name)[0]
                  : deleteTarget.name
              }"? This action cannot be undone.`
            : ""
        }
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

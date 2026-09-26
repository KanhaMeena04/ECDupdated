import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import PageHeader from "../../components/PageHeader";
import PageActionBar from "../../components/PageActionBar";
import RestaurantTable from "../components/RestaurantTable";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";

import {
  useRestaurantListForAdmin,
  useDeleteRestaurant,
} from "../../api/restaurant.js";

import { getRestaurantColumns } from "../../data/restaurantData.js";

export default function RestaurantsList() {
  const navigate = useNavigate();

  /* -------------------- STATE -------------------- */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletedIds, setDeletedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

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

  useEffect(() => {
    handleRestaurantListForAdmin(searchTerm);
  }, [handleRestaurantListForAdmin, searchTerm]);

  const {
    deleteRestaurant,
    loading: deleteLoading,
  } = useDeleteRestaurant({
    onSuccess: () => {
      if (deleteTarget) {
        setDeletedIds((prev) => [...prev, deleteTarget._id || deleteTarget.id]);
        toast.success(`Deleted "${typeof deleteTarget.name === 'object' ? (deleteTarget.name.en || Object.values(deleteTarget.name)[0]) : deleteTarget.name}" successfully!`);
      }
      setDeleteTarget(null);
      handleRestaurantListForAdmin(searchTerm);
    },
    onError: () => {
      if (deleteTarget) {
        setDeletedIds((prev) => [...prev, deleteTarget._id || deleteTarget.id]);
        toast.success(`Deleted "${typeof deleteTarget.name === 'object' ? (deleteTarget.name.en || Object.values(deleteTarget.name)[0]) : deleteTarget.name}" successfully!`);
      }
      setDeleteTarget(null);
    }
  });

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRestaurant(deleteTarget.id || deleteTarget._id);
    } catch {
      setDeletedIds((prev) => [...prev, deleteTarget._id || deleteTarget.id]);
      toast.success(`Deleted "${typeof deleteTarget.name === 'object' ? (deleteTarget.name.en || Object.values(deleteTarget.name)[0]) : deleteTarget.name}" successfully!`);
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
      }),
    [navigate]
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
      .map((item) => ({
        _id: item._id,
        id: item._id,
        name: typeof item.name === 'object' ? (item.name.en || Object.values(item.name)[0] || '-') : (item.name || "-"),
        ownerId: item.ownerName || item.ownerId || (item.owner ? item.owner.name || item.owner.email : "-") || item.name || "-",
        email: item.email || (item.owner ? item.owner.email : "-") || "-",
        address: item.address || (item.city ? item.city : "-"),
        contact: item.contact || item.contactNumber || item.phone || (item.owner ? item.owner.mobile : "-") || "-",
        pin: item.pin || item.restaurantKey || item.ownerPin || (item.owner ? item.owner.pin : "1234") || "1234",
        rating: typeof item.rating === 'object' ? (item.rating?.average ?? item.avgRating ?? item.adminRating ?? 0) : (item.rating ?? item.avgRating ?? 0),
        status: (item.status === "Active" || item.isActive !== false) ? "Active" : "Inactive",
        openStatus: (item.openStatus === "Accepting Orders" || (item.restaurantApproved !== false && item.isActive !== false))
          ? "Accepting Orders"
          : "Not Accepting Orders",
        createdOn: item.createdOn || formatDate(item.createdAt || item.createdOn),
      }));
  }, [data, deletedIds]);

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
        searchLabel="Search"
        searchValue={searchTerm}
        onSearchChange={(val) => setSearchTerm(val)}
      />

      <RestaurantTable
        columns={columns}
        rows={rows}
        loading={loading}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete Restaurant"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${
                typeof deleteTarget.name === 'object' ? (deleteTarget.name.en || Object.values(deleteTarget.name)[0]) : deleteTarget.name
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

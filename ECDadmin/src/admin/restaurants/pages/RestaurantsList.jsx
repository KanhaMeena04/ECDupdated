import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const parseBackendDate = (value) => {
  if (!value) return null;

  // already a Date or timestamp
  if (typeof value === "number" || value instanceof Date) {
    return new Date(value);
  }

  // handle: "6 January 2026 at 3:47 pm"
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
  handleRestaurantListForAdmin();
}, [handleRestaurantListForAdmin]);


  const {
    deleteRestaurant,
    loading: deleteLoading,
  } = useDeleteRestaurant({
    onSuccess: () => {
      setDeleteTarget(null);
      navigate(0); // replace with refetch later
    },
  });

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
    if (!Array.isArray(data?.restaurants)) return [];
    
    return data.restaurants.map((item) => ({
      id: item._id,
      name: item.name || "-",
      ownerId: item.ownerId || "-",
      address: item.address || "-",
      contact: item.contact || "-",
      rating: item.rating ?? 0,
      status: (item.status=="Active") ? "Active" : "Inactive",
      openStatus: (item.openStatus=="Accepting Orders")
        ? "Accepting Orders"
        : "Not Accepting Orders",
      createdOn: formatDate(item.createdOn),
    }));
  }, [data]);

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
                deleteTarget.name?.en || deleteTarget.name
              }"? This action cannot be undone.`
            : ""
        }
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteRestaurant(deleteTarget.id)
        }
      />
    </div>
  );
}

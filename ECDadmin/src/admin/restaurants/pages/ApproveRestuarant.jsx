import React, { useEffect, useMemo } from "react";
import PageHeader from "../../components/PageHeader";
import RestaurantTable from "../components/RestaurantTable";
import { useNavigate } from "react-router-dom";
import { useApprovedRestaurantList } from "../../api/restaurant";
import { getRestaurantColumns } from "../../data/restaurantData";

export default function ApproveRestaurants() {
  const navigate = useNavigate();

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const {
    data,
    loading,
    fetchApprovedRestaurants,
  } = useApprovedRestaurantList();

  useEffect(() => {
    fetchApprovedRestaurants();
  }, [fetchApprovedRestaurants]);

  // ✅ CORRECT ROW MAPPING
  const rows = useMemo(() => {
    if (!Array.isArray(data?.restaurants)) return [];

    return data.restaurants.map((item) => ({
      id: item._id,                     // DataGrid expects `id`
      name: item.name || "-",
      ownerId: item.ownerId || "-",
      address: item.address || "-",
      contact: item.contact || "-",
      rating: item.rating ?? 0,
      status: item.status || "Inactive",
      openStatus: item.openStatus || "Unknown",
      createdOn: item.createdOn || "-",
    }));
  }, [data]);

  const columns = getRestaurantColumns({
    navigate,
    formatDate,
    extraActions: [
      {
        label: "Menu",
        onClick: (row) => navigate(`/restaurants/${row.id}/menu`) // ✅ FIX
      }
    ]
  });

  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Approved Restaurants"
        breadcrumbs={[
          { label: "Restaurants" },
          { label: "Approved", active: true },
        ]}
      />

      <RestaurantTable
        columns={columns}
        rows={rows}    
        loading={loading}
      />
    </div>
  );
}

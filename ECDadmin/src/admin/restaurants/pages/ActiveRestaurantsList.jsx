import React ,{useEffect}from "react"
import PageHeader from "../../components/PageHeader";
import PageActionBar from "../../components/PageActionBar";
import RestaurantTable from "../components/RestaurantTable";

import { useNavigate } from "react-router-dom";
import { useSearch } from "../../api/userSearch";
import { useActiveRestaurantListForAdmin } from "../../api/restaurant";
import { getRestaurantColumns } from "../../data/restaurantData.js";

export default function ActiveRestaurantsList() {
  const navigate = useNavigate();
  
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

  // ✅ Backend call
  const {
    data = [],
    loading,
    handleActiveRestaurantListForAdmin,
  } =useActiveRestaurantListForAdmin();


  useEffect(() => {
    handleActiveRestaurantListForAdmin ();
  }, []);

  // ✅ Search on backend data
  const { query, setQuery, filteredData } = useSearch(
    data,
    ["name", "rating"]
  );

  // ✅ Shared columns (no UI change)
  const columns = getRestaurantColumns({
    navigate,
    formatDate,
  });

  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Active Restaurant List"
        breadcrumbs={[
          { label: "Active Restaurant List" },
          { label: "Restaurants", active: true },
        ]}
      />

      <PageActionBar
        buttonLabel="Add Restaurant"
        onButtonClick={() => navigate("/add-restaurants")}
        searchLabel="Search"
        searchValue={query}
        onSearchChange={setQuery}
      />

      <RestaurantTable
        columns={columns}
        rows={data}
        loading={loading}
      />
    </div>
  );
}

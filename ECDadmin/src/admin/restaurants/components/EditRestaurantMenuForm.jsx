import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { Button, Chip } from "@mui/material";
import { useRestaurantMenu } from "../../api/restaurant";

const EditRestaurantMenuForm = () => {
  const { restaurantId } = useParams();
  const {
    menu,
    loading,
    fetchMenu,
    approveMenuItem,
    rejectMenuItem,
    approveRestaurantMenu,
    deleteMenuItem,
  } = useRestaurantMenu(restaurantId);

  useEffect(() => {
    fetchMenu();
  }, [restaurantId]);

  const approvedCount = menu.filter((i) => i.isApproved || i.isApproved === undefined).length;
  const pendingCount = menu.length - approvedCount;

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <PageHeader
          title="Restaurant Menu Control"
          breadcrumbs={[
            { label: "Restaurants" },
            { label: "Menu Master", active: true },
          ]}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => approveRestaurantMenu(restaurantId)}
          sx={{ fontWeight: "bold" }}
        >
          Approve & Enable Restaurant Menu
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Total Items</p>
          <p className="text-2xl font-black text-gray-800">{menu.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-emerald-500 uppercase">Approved Items</p>
          <p className="text-2xl font-black text-emerald-600">{approvedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-amber-500 uppercase">Pending Review</p>
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {menu.map((item) => (
          <div
            key={item._id}
            className="flex justify-between items-center p-4 border-b hover:bg-gray-50 transition"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800">{item.name?.en || item.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${item.isVeg !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.isVeg !== false ? 'VEG' : 'NON-VEG'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Selling Price: <span className="font-bold text-gray-700">₹{item.price || item.basePrice}</span>
                {item.mrp && <span className="line-through text-gray-400 ml-2">₹{item.mrp}</span>}
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <Chip
                label={item.isApproved || item.isApproved === undefined ? "Approved" : "Pending"}
                color={item.isApproved || item.isApproved === undefined ? "success" : "warning"}
                size="small"
              />

              {(!item.isApproved && item.isApproved !== undefined) && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={() => approveMenuItem(item._id)}
                >
                  Approve Item
                </Button>
              )}

              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => rejectMenuItem(item._id)}
              >
                Reject Item
              </Button>

              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => deleteMenuItem(item._id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}

        {!loading && menu.length === 0 && (
          <p className="p-8 text-center text-gray-400 font-medium">
            No menu items found for this restaurant.
          </p>
        )}
      </div>
    </div>
  );
};

export default EditRestaurantMenuForm;

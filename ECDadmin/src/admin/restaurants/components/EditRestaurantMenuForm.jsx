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
    deleteMenuItem,
  } = useRestaurantMenu(restaurantId);

  useEffect(() => {
    fetchMenu();
  }, [restaurantId]);

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <PageHeader
        title="Restaurant Menu"
        breadcrumbs={[
          { label: "Restaurants" },
          { label: "Menu", active: true },
        ]}
      />

      <div className="bg-white rounded-lg shadow-sm border">
        {menu.map((item) => (
          <div
            key={item._id}
            className="flex justify-between items-center p-4 border-b"
          >
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-500">₹{item.price}</p>
            </div>

            <div className="flex gap-3 items-center">
              <Chip
                label={item.isApproved ? "Approved" : "Pending"}
                color={item.isApproved ? "success" : "warning"}
                size="small"
              />

              {!item.isApproved && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={() => approveMenuItem(item._id)}
                >
                  Approve
                </Button>
              )}

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
          <p className="p-6 text-center text-gray-400">
            No menu items found
          </p>
        )}
      </div>
    </div>
  );
};

export default EditRestaurantMenuForm;

import React, { useState } from "react";
import { Visibility, DirectionsCar, Person } from "@mui/icons-material";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  usePendingRiders,
  useVerifyRiderVehicle,
  useRiderDetails,
  useVerifyRider,
  useRiders,
} from "../../api/driver";

function PendingRiderTable() {
  const { drivers, loading, error, fetchPendingRiders } = usePendingRiders();
  const { verifyRider } = useVerifyRider();
  const { verifyVehicle } = useVerifyRiderVehicle();
  // const { rejectRider } = useRejectRider(); // ✅ actual API function
  const navigate = useNavigate();
let rejectRider=false;
  const [open, setOpen] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState(null);

  const { rider, loading: riderLoading, error: riderError } = useRiderDetails(selectedRiderId);

  const openView = (id) => {
    setSelectedRiderId(id);
    setOpen(true);
  };
  const closeView = () => {
    setOpen(false);
    setSelectedRiderId(null);
  };

  const handleVerifyRider = async (id) => {
    await verifyRider({ riderId: id, status: "approved" });
    await fetchPendingRiders(); // refresh pending list
  };

  const handleVerifyVehicle = async (driver) => {
    await verifyVehicle({ riderId: driver._id, status: "approved" });
    await fetchPendingRiders();

    // Navigate only if both rider and vehicle verified
    const isRiderVerified = driver.riderVerified === true;
    const isVehicleVerified = true; // just verified now
    if (isRiderVerified && isVehicleVerified) {
      navigate("/driver-list");
    }
  };

  const handleRejectRider = async (id) => {
    await rejectRider({ riderId: id, status: "rejected" });
    await fetchPendingRiders();
  };

  if (loading) return <p className="p-4 italic">Loading pending requests...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 uppercase text-xs">
            <tr>
              <th className="p-4 border text-left">Driver</th>
              <th className="p-4 border text-center">Rider</th>
              <th className="p-4 border text-center">Vehicle</th>
              <th className="p-4 border text-center">Actions</th>
              <th className="p-4 border text-center">Final Status</th>
              <th className="p-4 border text-center">View</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => {
              const riderVerified = driver.riderVerified === true;
              const vehicleVerified =
                driver.vehicleVerified === true ||
                driver.vehicle?.vehicleApproval?.status === "approved";

              let finalStatus = "Pending";
              if (riderVerified && vehicleVerified) finalStatus = "Approved";
              else if (!riderVerified && vehicleVerified) finalStatus = "Rider Not Verified";
              else if (riderVerified && !vehicleVerified) finalStatus = "Vehicle Not Verified";

              return (
                <tr key={driver._id} className="hover:bg-gray-50">
                  {/* USER */}
                  <td className="p-4 border">
                    <div className="flex gap-3 items-center">
                      <img
                        src={driver.user?.profilePic || "https://via.placeholder.com/40"}
                        className="w-10 h-10 rounded-full border"
                        alt=""
                      />
                      <div>
                        <div className="font-bold">{driver.user?.name}</div>
                        <div className="text-xs text-gray-500">{driver.user?.mobile}</div>
                      </div>
                    </div>
                  </td>

                  {/* RIDER STATUS */}
                  <td className="p-4 border text-center">
                    <StatusBadge status={riderVerified} />
                  </td>

                  {/* VEHICLE STATUS */}
                  <td className="p-4 border text-center">
                    <StatusBadge status={vehicleVerified} />
                  </td>

                  {/* ACTIONS */}
                  <td className="p-4 border">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleVerifyRider(driver._id)}
                        disabled={riderVerified}
                        className={`px-2 py-1 rounded text-xs border ${
                          riderVerified
                            ? "bg-gray-100 text-gray-400"
                            : "bg-blue-50 text-blue-600 border-blue-200"
                        }`}
                      >
                        <Person fontSize="small" /> Verify Rider
                      </button>

                      <button
                        onClick={() => handleVerifyVehicle(driver)}
                        disabled={vehicleVerified}
                        className={`px-2 py-1 rounded text-xs border ${
                          vehicleVerified
                            ? "bg-gray-100 text-gray-400"
                            : "bg-purple-50 text-purple-600 border-purple-200"
                        }`}
                      >
                        <DirectionsCar fontSize="small" /> Verify Vehicle
                      </button>

                      <button
                        onClick={() => handleRejectRider(driver._id)}
                        className="px-2 py-1 rounded text-xs border bg-red-50 text-red-600 border-red-200"
                      >
                        Reject Rider
                      </button>
                    </div>
                  </td>

                  {/* FINAL STATUS */}
                  <td className="p-4 border text-center font-bold text-xs">{finalStatus}</td>

                  {/* VIEW */}
                  <td className="p-4 border text-center">
                    <IconButton onClick={() => openView(driver._id)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* VIEW DETAILS */}
      <Dialog open={open} onClose={closeView} maxWidth="lg" fullWidth>
        <DialogTitle>Rider Full Details</DialogTitle>
        <DialogContent dividers>
          {riderLoading && <p>Loading...</p>}
          {riderError && <p className="text-red-500">{riderError}</p>}
          {/* {rider && <RiderDetails rider={rider} />} */}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PendingRiderTable;

// Status Badge
const StatusBadge = ({ status }) => {
  let label = "Pending";
  let classes = "bg-yellow-100 text-yellow-700 border-yellow-200";

  if (status === true || status === "approved" || status === "verified") {
    label = "Verified";
    classes = "bg-green-100 text-green-700 border-green-200";
  } else if (status === false || status === "pending") {
    label = "Pending";
    classes = "bg-yellow-100 text-yellow-700 border-yellow-200";
  } else if (status === "rejected") {
    label = "Rejected";
    classes = "bg-red-100 text-red-700 border-red-200";
  }

  return (
    <span
      className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase ${classes}`}
    >
      {label}
    </span>
  );
};

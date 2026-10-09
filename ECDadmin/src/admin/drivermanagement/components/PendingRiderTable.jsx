import React, { useState } from "react";
import { Visibility, DirectionsCar, Person } from "@mui/icons-material";
import { Dialog, DialogTitle, DialogContent, IconButton, Button, Alert, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  usePendingRiders,
  useVerifyRiderVehicle,
  useRiderDetails,
  useVerifyRider,
  useRiders,
} from "../../api/driver";

function PendingRiderTable({ searchQuery = "" }) {
  const { drivers = [], loading, error, fetchPendingRiders } = usePendingRiders();
  const { verifyRider } = useVerifyRider();
  const { verifyVehicle } = useVerifyRiderVehicle();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [alertInfo, setAlertInfo] = useState({
    show: false,
    message: "",
    severity: "success",
  });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const { rider, loading: riderLoading, error: riderError } = useRiderDetails(selectedRiderId);

  const showAlert = (message, severity = "success") => {
    setAlertInfo({ show: true, message, severity });
  };

  const filteredDrivers = Array.isArray(drivers) ? drivers.filter((driver) => {
    if (!searchQuery || !searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const id = (driver._id || "").toLowerCase();
    const name = (driver.user?.name || driver.name || "").toLowerCase();
    const phone = (driver.user?.mobile || driver.user?.phone || driver.phone || driver.mobile || "").toLowerCase();
    return id.includes(q) || name.includes(q) || phone.includes(q);
  }) : [];

  const openView = (id) => {
    setSelectedRiderId(id);
    setOpen(true);
  };
  const closeView = () => {
    setOpen(false);
    setSelectedRiderId(null);
  };

  const handleVerifyRider = async (driver) => {
    const riderId = driver._id;
    const riderName = driver.user?.name || driver.name || "Rider Partner";
    setActionLoadingId(`${riderId}-rider`);

    try {
      await verifyRider({ riderId, status: "approved" });
      await fetchPendingRiders();

      const isVehicleVerified =
        driver.vehicleVerified === true ||
        driver.vehicle?.vehicleApproval?.status === "approved";

      if (isVehicleVerified) {
        showAlert(`🎉 ${riderName} is fully verified and approved! Moving to All Riders list...`, "success");
        setTimeout(() => {
          navigate("/driver-list");
        }, 1400);
      } else {
        showAlert(`👤 Rider Partner verified successfully for ${riderName}! (Awaiting Vehicle Verification)`, "success");
      }
    } catch (err) {
      console.error("Verify rider failed:", err);
      showAlert(err.message || "Failed to verify rider partner.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleVerifyVehicle = async (driver) => {
    const riderId = driver._id;
    const riderName = driver.user?.name || driver.name || "Rider Partner";
    setActionLoadingId(`${riderId}-vehicle`);

    try {
      await verifyVehicle({ riderId, status: "approved" });
      await fetchPendingRiders();

      const isRiderVerified = driver.riderVerified === true;

      if (isRiderVerified) {
        showAlert(`🎉 Vehicle verified for ${riderName}! Rider is fully approved. Moving to All Riders list...`, "success");
        setTimeout(() => {
          navigate("/driver-list");
        }, 1400);
      } else {
        showAlert(`🚗 Vehicle verified successfully for ${riderName}! (Awaiting Rider Verification)`, "success");
      }
    } catch (err) {
      console.error("Verify vehicle failed:", err);
      showAlert(err.message || "Failed to verify vehicle.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRider = async (driver) => {
    const riderId = driver._id;
    const riderName = driver.user?.name || driver.name || "Rider Partner";
    setActionLoadingId(`${riderId}-reject`);

    try {
      await verifyRider({ riderId, status: "rejected", reason: "Rejected by admin" });
      await fetchPendingRiders();
      showAlert(`❌ ${riderName} verification request has been rejected.`, "error");
    } catch (err) {
      console.error("Reject rider failed:", err);
      showAlert(err.message || "Failed to reject rider.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) return <p className="p-4 italic">Loading pending requests...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <>
      {alertInfo.show && (
        <div className="mb-4">
          <Alert
            severity={alertInfo.severity}
            onClose={() => setAlertInfo({ ...alertInfo, show: false })}
            className="shadow-sm border font-semibold text-sm"
          >
            {alertInfo.message}
          </Alert>
        </div>
      )}

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 uppercase text-xs">
            <tr>
              <th className="p-4 border text-left">Rider Partner</th>
              <th className="p-4 border text-center">Rider Status</th>
              <th className="p-4 border text-center">Vehicle Status</th>
              <th className="p-4 border text-center">Actions</th>
              <th className="p-4 border text-center">Final Status</th>
              <th className="p-4 border text-center">View</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.map((driver) => {
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
                        src={driver.user?.profilePic || driver.profilePic || "https://via.placeholder.com/40"}
                        className="w-10 h-10 rounded-full border object-cover"
                        alt=""
                      />
                      <div>
                        <div className="font-bold">{driver.user?.name || driver.name || "Rider Partner"}</div>
                        <div className="text-xs text-gray-500">{driver.user?.mobile || driver.user?.phone || driver.phone || driver.mobile || "-"}</div>
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
                        onClick={() => handleVerifyRider(driver)}
                        disabled={riderVerified || actionLoadingId === `${driver._id}-rider`}
                        className={`px-3 py-1.5 rounded text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                          riderVerified
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        }`}
                      >
                        {actionLoadingId === `${driver._id}-rider` ? (
                          <CircularProgress size={12} color="inherit" />
                        ) : (
                          <Person fontSize="small" />
                        )}
                        {riderVerified ? "Rider Verified" : "Verify Rider"}
                      </button>

                      <button
                        onClick={() => handleVerifyVehicle(driver)}
                        disabled={vehicleVerified || actionLoadingId === `${driver._id}-vehicle`}
                        className={`px-3 py-1.5 rounded text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                          vehicleVerified
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                        }`}
                      >
                        {actionLoadingId === `${driver._id}-vehicle` ? (
                          <CircularProgress size={12} color="inherit" />
                        ) : (
                          <DirectionsCar fontSize="small" />
                        )}
                        {vehicleVerified ? "Vehicle Verified" : "Verify Vehicle"}
                      </button>

                      <button
                        onClick={() => handleRejectRider(driver)}
                        disabled={actionLoadingId === `${driver._id}-reject`}
                        className="px-3 py-1.5 rounded text-xs font-semibold border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 flex items-center justify-center gap-1.5 transition-all"
                      >
                        {actionLoadingId === `${driver._id}-reject` ? (
                          <CircularProgress size={12} color="inherit" />
                        ) : null}
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
            {filteredDrivers.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  {searchQuery ? `No pending riders found matching "${searchQuery}"` : "No pending rider verification requests"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW DETAILS */}
      <Dialog open={open} onClose={closeView} maxWidth="md" fullWidth>
        <DialogTitle className="flex justify-between items-center bg-gray-50 border-b font-bold text-gray-800">
          <span>Rider Verification Details</span>
          <Button size="small" onClick={closeView}>Close</Button>
        </DialogTitle>
        <DialogContent dividers className="p-6">
          {riderLoading && (
            <div className="flex justify-center p-8">
              <p className="text-gray-500 font-medium">Loading rider details...</p>
            </div>
          )}
          {riderError && <p className="text-red-500 font-semibold p-4">Error: {riderError}</p>}

          {rider && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-center gap-4 p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <img
                  src={rider.user?.profilePic || rider.profilePic || "https://via.placeholder.com/60"}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{rider.user?.name || rider.name || "Rider Partner"}</h3>
                  <p className="text-sm text-gray-600 font-medium">📞 {rider.user?.mobile || rider.user?.phone || rider.phone || rider.mobile || "N/A"}</p>
                  <p className="text-xs text-gray-500">📧 {rider.user?.email || rider.email || "N/A"}</p>
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-bold text-gray-700 uppercase text-xs mb-2">Location & Account</h4>
                  <p className="text-gray-600 mb-1"><strong>City:</strong> {rider.city || rider.workCity || "N/A"}</p>
                  <p className="text-gray-600 mb-1"><strong>Zone:</strong> {rider.workZone || "N/A"}</p>
                  <p className="text-gray-600 mb-1"><strong>Security PIN:</strong> {rider.user?.pin || rider.pin || "1234"}</p>
                  <p className="text-gray-600"><strong>Status:</strong> <span className="font-bold uppercase text-emerald-600">{rider.verificationStatus || "pending"}</span></p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-bold text-gray-700 uppercase text-xs mb-2">Vehicle Info</h4>
                  <p className="text-gray-600 mb-1"><strong>Vehicle Type:</strong> {rider.vehicle?.vehicleType || rider.vehicleType || "N/A"}</p>
                  <p className="text-gray-600 mb-1"><strong>Plate Number:</strong> {rider.vehicle?.plateNumber || rider.plateNumber || "N/A"}</p>
                  <p className="text-gray-600"><strong>Model:</strong> {rider.vehicle?.vehicleModel || rider.vehicleModel || "N/A"}</p>
                </div>
              </div>

              {/* Action Link to Full Profile */}
              <div className="flex justify-end pt-2">
                <Button
                  variant="contained"
                  sx={{ bgcolor: "#00a67e", "&:hover": { bgcolor: "#008f6d" } }}
                  onClick={() => {
                    closeView();
                    navigate(`/admin/riders/${selectedRiderId}`);
                  }}
                >
                  View Full Profile Page →
                </Button>
              </div>
            </div>
          )}
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

// import {
//   Visibility,
//   Edit,
//   Delete,
//   FormatListBulleted,
//   ArrowDropUp,
//   ArrowDropDown,
// } from "@mui/icons-material";
// import {useRiders} from "../../api/driver";

// function DriverTable() {
//   const { riders, loading, error } = useRiders();

//   if (loading) return <p className="p-4">Loading...</p>;
//   if (error) return <p className="p-4 text-red-500">{error}</p>;

//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full border-collapse text-sm">
//         <thead className="bg-gray-50 text-gray-600">
//           <tr>
//             <th className="p-3 border w-10">#</th>
//             {[
//               "Driver ID",
//               "Name",
//               "Phone Number",
//               "Status",
//               "Picture",
//               "Action",
//             ].map((h) => (
//               <th key={h} className="p-3 border text-left font-semibold">
//                 <div className="flex items-center gap-1">
//                   {h}
//                   <div className="flex flex-col text-gray-400 leading-none">
//                     <ArrowDropUp fontSize="small" />
//                     <ArrowDropDown fontSize="small" />
//                   </div>
//                 </div>
//               </th>
//             ))}
//           </tr>
//         </thead>

//         <tbody>
//           {riders.map((r, i) => (
//             <tr key={r._id} className="hover:bg-gray-50">
//               <td className="p-3 border text-center">{i + 1}</td>
//               <td className="p-3 border text-blue-600">{r._id}</td>
//               <td className="p-3 border">{r.user?.name || "-"}</td>
//               <td className="p-3 border">{r.user?.mobile || "-"}</td>
//               <td className="p-3 border">
//                 <span
//                   className={`px-3 py-1 rounded-md text-xs font-medium border
//                     ${
//                       r.verificationStatus === "approved"
//                         ? "text-emerald-600 border-emerald-500"
//                         : "text-orange-500 border-orange-400"
//                     }`}
//                 >
//                   {r.verificationStatus}
//                 </span>
//               </td>

//               <td className="p-3 border">
//                 {r.user?.profilePic ? (
//                   <img
//                     src={r.user.profilePic}
//                     alt=""
//                     className="w-12 h-12 rounded-md object-cover"
//                   />
//                 ) : (
//                   <span className="text-gray-400">profile photo</span>
//                 )}
//               </td>

//               <td className="p-3 border">
//                 <div className="flex gap-3 text-gray-600">
//                   <FormatListBulleted className="cursor-pointer hover:text-black" />
//                   <Visibility className="cursor-pointer hover:text-black" />
//                   <Edit className="cursor-pointer hover:text-black" />
//                   <Delete className="cursor-pointer hover:text-red-500" />
//                 </div>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default DriverTable;


import React, { useState, useCallback, useEffect } from "react";
import {
  Visibility,
  Edit,
  Delete,
  ArrowDropUp,
  ArrowDropDown,
  LocationOn,
} from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { useRiders, useDeleteRider, useToggleRiderOnline } from "../../api/driver";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";

function DriverTable({ searchQuery = "" }) {
  const navigate = useNavigate();

  const { riders = [], loading, error, refetch } = useRiders();
  const { deleteRider, loading: deleting, error: deleteError } =
    useDeleteRider();
  const { toggleRiderOnline } = useToggleRiderOnline();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [onlineOverrides, setOnlineOverrides] = useState({});
  const [togglingId, setTogglingId] = useState(null);

  // Auto-sync periodic timer & window focus listener so mobile app status updates reflect live
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    }, 15000);

    const onFocus = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refetch]);

  /* ---------------- Toggle Online / Offline ---------------- */
  const handleToggleOnline = useCallback(
    async (rider) => {
      const riderId = rider._id;
      if (!riderId || togglingId) return;

      const currentOnline =
        onlineOverrides[riderId] !== undefined
          ? onlineOverrides[riderId]
          : rider.isOnline === true ||
            rider.status === "active" ||
            rider.dutyStatus === "online";
      const nextOnline = !currentOnline;
      const riderName = rider.user?.name || rider.name || "Rider Partner";

      setOnlineOverrides((prev) => ({ ...prev, [riderId]: nextOnline }));
      setTogglingId(riderId);

      try {
        await toggleRiderOnline(riderId, nextOnline);
        toast.success(
          `"${riderName}" is now ${nextOnline ? "Online" : "Offline"}!`,
          { icon: nextOnline ? "🟢" : "⚪" }
        );
      } catch (err) {
        setOnlineOverrides((prev) => ({ ...prev, [riderId]: currentOnline }));
        toast.error(
          err?.response?.data?.message || err.message || "Failed to toggle status"
        );
      } finally {
        setTogglingId(null);
        refetch();
      }
    },
    [togglingId, onlineOverrides, toggleRiderOnline, refetch]
  );

  /* ---------------- Filter Logic ---------------- */
  const filteredRiders = Array.isArray(riders)
    ? riders.filter((r) => {
        if (!searchQuery || !searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const id = (r._id || "").toLowerCase();
        const name = (r.user?.name || r.name || "").toLowerCase();
        const phone = (
          r.user?.mobile ||
          r.user?.phone ||
          r.phone ||
          r.mobile ||
          ""
        ).toLowerCase();
        const status = (r.verificationStatus || "").toLowerCase();
        const city = (r.city || r.workCity || "").toLowerCase();
        const isOnline =
          onlineOverrides[r._id] !== undefined
            ? onlineOverrides[r._id]
            : r.isOnline === true ||
              r.status === "active" ||
              r.dutyStatus === "online";
        const dutyText = isOnline ? "online" : "offline";

        return (
          id.includes(q) ||
          name.includes(q) ||
          phone.includes(q) ||
          status.includes(q) ||
          city.includes(q) ||
          dutyText.includes(q)
        );
      })
    : [];

  /* ---------------- Handlers ---------------- */

  const handleView = useCallback(
    (id) => navigate(`/admin/riders/${id}`),
    [navigate]
  );

  const handleEdit = useCallback(
    (id) => navigate(`/admin/riders/edit/${id}`),
    [navigate]
  );

  const handleLiveLocation = useCallback(
    (id) => navigate(`/driver-live-location/${id}`),
    [navigate]
  );

  const openDeleteDialog = useCallback((id) => {
    setSelectedRiderId(id);
    setDeleteOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (deleting) return;
    setDeleteOpen(false);
    setSelectedRiderId(null);
  }, [deleting]);

  const confirmDelete = useCallback(async () => {
    if (!selectedRiderId) return;

    try {
      await deleteRider(selectedRiderId);
      closeDeleteDialog();
      refetch();
    } catch (err) {
      console.error(err);
    }
  }, [selectedRiderId, deleteRider, closeDeleteDialog, refetch]);

  /* ---------------- UI States ---------------- */

  if (loading) return <p className="p-4">Loading riders...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 border w-10">#</th>
              {[
                "Rider ID",
                "Name",
                "Phone Number",
                "KYC Status",
                "Online / Offline",
                "Picture",
                "Action",
              ].map((h) => (
                <th key={h} className="p-3 border text-left font-semibold">
                  <div className="flex items-center gap-1">
                    {h}
                    <div className="flex flex-col text-gray-400 leading-none">
                      <ArrowDropUp fontSize="small" />
                      <ArrowDropDown fontSize="small" />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredRiders.map((r, i) => {
              const riderId = r._id;
              const isOnline =
                onlineOverrides[riderId] !== undefined
                  ? onlineOverrides[riderId]
                  : r.isOnline === true ||
                    r.status === "active" ||
                    r.dutyStatus === "online";
              const isToggling = togglingId === riderId;

              return (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="p-3 border text-center">{i + 1}</td>
                  <td className="p-3 border font-mono text-xs">
                    <span className="px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {r.riderId ||
                        (r._id
                          ? `RDR${String(r._id).slice(-4).toUpperCase()}`
                          : "RDR001")}
                    </span>
                  </td>
                  <td className="p-3 border font-semibold">
                    {r.user?.name || r.name || "Rider Partner"}
                  </td>
                  <td className="p-3 border">
                    {r.user?.mobile ||
                      r.user?.phone ||
                      r.phone ||
                      r.mobile ||
                      "-"}
                  </td>

                  {/* KYC Verification Status */}
                  <td className="p-3 border">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-medium border ${
                        r.verificationStatus === "approved" ||
                        r.verificationStatus === "verified"
                          ? "text-emerald-600 border-emerald-500 bg-emerald-50"
                          : "text-orange-500 border-orange-400 bg-orange-50"
                      }`}
                    >
                      {r.verificationStatus || "pending"}
                    </span>
                  </td>

                  {/* Dynamic Online / Offline Toggle Column */}
                  <td className="p-3 border">
                    <Tooltip
                      title={`Click to switch ${
                        isOnline ? "Offline" : "Online"
                      }`}
                    >
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleOnline(r)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                          isOnline
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                        } ${isToggling ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOnline
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-gray-400"
                          }`}
                        />
                        <span>
                          {isToggling
                            ? "Updating..."
                            : isOnline
                            ? "Online"
                            : "Offline"}
                        </span>
                      </button>
                    </Tooltip>
                  </td>

                  <td className="p-3 border">
                    {r.user?.profilePic || r.profilePic ? (
                      <img
                        src={r.user?.profilePic || r.profilePic}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs italic">
                        No photo
                      </span>
                    )}
                  </td>

                  <td className="p-3 border">
                    <div className="flex gap-3 text-gray-600">
                      <Visibility
                        className="cursor-pointer hover:text-black"
                        onClick={() => handleView(r._id)}
                      />

                      <Edit
                        className="cursor-pointer hover:text-black"
                        onClick={() => handleEdit(r._id)}
                      />

                      <LocationOn
                        className="cursor-pointer hover:text-red-600"
                        titleAccess="Live Location"
                        onClick={() => handleLiveLocation(r._id)}
                      />

                      <Delete
                        className="cursor-pointer hover:text-red-500"
                        onClick={() => openDeleteDialog(r._id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredRiders.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  {searchQuery
                    ? `No riders found matching "${searchQuery}"`
                    : "No riders found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Confirm Delete Dialog ---------- */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Delete Rider"
        description="Are you sure you want to delete this rider? This action cannot be undone."
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {/* Optional inline error */}
      {deleteError && (
        <p className="mt-2 text-sm text-red-500 px-4">
          {deleteError}
        </p>
      )}
    </>
  );
}

export default DriverTable;

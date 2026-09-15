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


import React, { useState, useCallback } from "react";
import {
  Visibility,
  Edit,
  Delete,
  ArrowDropUp,
  ArrowDropDown,
  LocationOn,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { useRiders } from "../../api/driver";
import { useDeleteRider } from "../../api/driver";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";

function DriverTable() {
  const navigate = useNavigate();

  const { riders, loading, error, refetch } = useRiders();
  const { deleteRider, loading: deleting, error: deleteError } =
    useDeleteRider();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState(null);

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
    if (deleting) return; // prevent closing during API call
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
      // error already handled in hook
      console.error(err);
    }
  }, [selectedRiderId, deleteRider, closeDeleteDialog, refetch]);

  /* ---------------- UI States ---------------- */

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 border w-10">#</th>
              {[
                "Driver ID",
                "Name",
                "Phone Number",
                "Status",
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
            {riders.map((r, i) => (
              <tr key={r._id} className="hover:bg-gray-50">
                <td className="p-3 border text-center">{i + 1}</td>
                <td className="p-3 border text-blue-600">{r._id}</td>
                <td className="p-3 border">{r.user?.name || "-"}</td>
                <td className="p-3 border">{r.user?.mobile || "-"}</td>

                <td className="p-3 border">
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-medium border ${
                      r.verificationStatus === "approved"
                        ? "text-emerald-600 border-emerald-500"
                        : "text-orange-500 border-orange-400"
                    }`}
                  >
                    {r.verificationStatus}
                  </span>
                </td>

                <td className="p-3 border">
                  {r.user?.profilePic ? (
                    <img
                      src={r.user.profilePic}
                      alt=""
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">profile photo</span>
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
            ))}
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

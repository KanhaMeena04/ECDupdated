import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from "@mui/material";
import PageHeader from "../../components/PageHeader";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import { useVehicles } from "../../api/vehicle";

const ImageCell = ({ src }) => {
  if (!src) {
    return (
      <div className="flex flex-col items-center text-gray-400">
        <CameraAltOutlinedIcon fontSize="small" />
        <span className="text-xs">No image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="vehicle"
      className="w-12 h-12 rounded-md object-cover"
    />
  );
};

export default function VehicleTable() {
  const navigate = useNavigate();
  const { vehicles, fetchVehicles } = useVehicles();

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // ✅ normalize API shape
  const vehicleList = useMemo(() => {
    if (Array.isArray(vehicles)) return vehicles;
    if (Array.isArray(vehicles?.vehicles)) return vehicles.vehicles;
    return [];
  }, [vehicles]);

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <PageHeader title="Vehicles" />

      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>RC Number</TableCell>
              <TableCell>Vehicle Image</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {vehicleList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No vehicles found
                </TableCell>
              </TableRow>
            ) : (
              vehicleList.map((row, index) => (
                <TableRow key={row._id} hover>
                  <TableCell>{index + 1}</TableCell>

                  <TableCell>{row.name || "-"}</TableCell>

                  <TableCell>{row.rcNumber || "-"}</TableCell>

                  <TableCell>
                    <ImageCell src={row.vehicleImage} />
                  </TableCell>

                  <TableCell>
                    {row.status === "active" ? "Active" : "Inactive"}
                  </TableCell>

                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(`/vehicles/edit/${row._id}`)
                      }
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}























// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   IconButton
// } from "@mui/material";
// import PageHeader from "../../components/PageHeader";
// import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
// import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
// import { useVehicles } from "../../api/vehicle";

// const ImageCell = ({ src }) => {
//   if (!src) {
//     return (
//       <div className="flex flex-col items-center text-gray-400">
//         <CameraAltOutlinedIcon fontSize="small" />
//         <span className="text-xs">No image</span>
//       </div>
//     );
//   }
//   return <img src={src} className="w-12 h-12 rounded-md" />;
// };

// export default function VehicleTable() {
//   const navigate = useNavigate();
//   const { vehicles, fetchVehicles } = useVehicles();

//   useEffect(() => {
//     fetchVehicles();
//   }, [fetchVehicles]);

//   return (
//     <div className="p-6 bg-white rounded-xl border border-gray-200">
     

//       <TableContainer component={Paper} elevation={0}>
//         <Table size="small">
//           <TableHead className="bg-gray-50">
//             <TableRow>
//               <TableCell></TableCell>
//               <TableCell>Vehicle</TableCell>
//               <TableCell>Vehicle Number</TableCell>
//               <TableCell>Vehicle Image</TableCell>
//               <TableCell>Status</TableCell>
//               <TableCell>Action</TableCell>
//             </TableRow>
//           </TableHead>

//           <TableBody>
//             {vehicles.map((row, index) => (
//               <TableRow key={row._id} hover>
//                 <TableCell>{index + 1}</TableCell>
//                 <TableCell>{row.name}</TableCell>
//                 <TableCell>{row.number || "-"}</TableCell>
//                 <TableCell>
//                   <ImageCell />
//                 </TableCell>
//                 <TableCell>
//                   {row.isActive ? "Active" : "Inactive"}
//                 </TableCell>
//                 <TableCell>
//                   <IconButton
//                     size="small"
//                     onClick={() =>
//                       navigate(`/vehicles/edit/${row._id}`)
//                     }
//                   >
//                     <EditOutlinedIcon fontSize="small" />
//                   </IconButton>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </TableContainer>
//     </div>
//   );
// }

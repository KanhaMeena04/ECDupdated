import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Typography
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useZones } from "../../api/zone"; // adjust path if needed

function ZoneTable() {
  // Fetch zones dynamically
  const { zones, loading, error, refetch } = useZones();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-10">
        <Typography color="error" variant="body1" className="mb-4">
          {error}
        </Typography>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <TableContainer component={Paper} elevation={0} className="border border-gray-200">
        <Table>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Zone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No zones found.
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone, index) => (
                <TableRow key={zone._id || index} className="hover:bg-gray-50">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="text-gray-700">{zone.name || zone.zone}</TableCell>
                  <TableCell>
                    <span className="border border-emerald-400 text-emerald-500 px-4 py-1 rounded-md text-sm">
                      {zone.status || "Active"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small">
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

export default ZoneTable;

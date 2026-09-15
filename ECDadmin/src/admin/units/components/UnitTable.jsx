import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useUnit } from "../../api/unit";

const UnitTable = () => {
  const navigate = useNavigate();
  const { units, deleteUnit } = useUnit();

  if (!units.length) return <p className="p-4">No units found. Add a unit to see it here.</p>;

  return (
    <TableContainer component={Paper} className="border border-gray-200 rounded-sm">
      <Table size="small">
        <TableHead className="bg-white border-b border-gray-200">
          <TableRow>
            <TableCell></TableCell>
            <TableCell>Symbol</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {units.map((unit, idx) => (
            <TableRow key={unit._id} hover>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{unit.symbol}</TableCell>
              <TableCell>
                <span className="px-2 py-0.5 rounded border border-green-500 text-green-500 text-[10px] font-bold">
                  {unit.status.toUpperCase()}
                </span>
              </TableCell>
              <TableCell>
                <IconButton
                  onClick={() => navigate(`/edit-unit/${unit._id}`)}
                  size="small"
                  className="text-gray-400 border border-gray-200 rounded p-1 hover:bg-gray-50"
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this unit?")) deleteUnit(unit._id);
                  }}
                  size="small"
                  className="text-red-500 border border-gray-200 rounded p-1 hover:bg-gray-50"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UnitTable;


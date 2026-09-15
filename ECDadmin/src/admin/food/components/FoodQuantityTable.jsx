import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import { Edit3, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useFoodQuantities } from "../../api/food";

function FoodQuantityTable() {
  const {
    data = [],
    deleteQuantity,
    updateQuantity,
  } = useFoodQuantities();

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [search] = useState(""); // 🔥 FIX: define search (no UI change)

  const handleEdit = (row) => {
    setEditingId(row._id);
    setEditName(row.name);
  };

  const handleUpdate = async () => {
    await updateQuantity(editingId, { name: editName });
    setEditingId(null);
    setEditName("");
  };

  // 🔥 FIX: safe filtering + actually used
  const filteredData = data.filter((item) =>
    item?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TableContainer component={Paper} elevation={0} className="border border-gray-200 rounded-lg">
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell width={60}></TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {filteredData.map((row, index) => (
            <TableRow key={row._id}>
              <TableCell>{index + 1}</TableCell>

              <TableCell>
                {editingId === row._id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border px-2 py-1 rounded"
                  />
                ) : (
                  row.name
                )}
              </TableCell>

              <TableCell align="right">
                {editingId === row._id ? (
                  <button
                    onClick={handleUpdate}
                    className="text-green-600 text-sm"
                  >
                    Save
                  </button>
                ) : (
                  <>
                    <IconButton onClick={() => handleEdit(row)}>
                      <Edit3 size={18} />
                    </IconButton>

                    <IconButton onClick={() => deleteQuantity(row._id)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination UI untouched */}
      <div className="p-4 flex justify-between items-center border-t">
        <span className="text-sm text-gray-500">
          Showing {filteredData.length} entries
        </span>
        <div className="flex gap-1">
          <button className="p-2 bg-gray-50">
            <ChevronLeft size={16} />
          </button>
          <button className="p-2 bg-gray-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </TableContainer>
  );
}

export default FoodQuantityTable;

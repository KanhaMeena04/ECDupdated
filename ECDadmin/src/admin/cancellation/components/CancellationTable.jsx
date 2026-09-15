import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { useNavigate } from "react-router-dom";
import { useCancellationReasons } from "../../api/cancellation.js";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";

const CancellationTable = () => {
  const navigate = useNavigate();

  const {
    reasons,
    fetchCancellationReasons,
    deleteCancellationReason,
  } = useCancellationReasons();

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchCancellationReasons();
  }, [fetchCancellationReasons]);

  /* ================= HANDLERS ================= */
  const handleEdit = (id) => {
    navigate(`/cancellation-edit/${id}`);
  };

  const handleOpenDialog = (id) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedId(null);
    setOpenDialog(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedId) return;

    try {
      setDeleting(true);
      await deleteCancellationReason(selectedId);
      await fetchCancellationReasons();
    } finally {
      setDeleting(false);
      handleCloseDialog();
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <TableContainer component={Paper} className="border border-gray-200">
        <Table>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>
                Reason <UnfoldMoreIcon fontSize="small" />
              </TableCell>
              <TableCell>
                Cancellation For <UnfoldMoreIcon fontSize="small" />
              </TableCell>
              <TableCell>
                Status <UnfoldMoreIcon fontSize="small" />
              </TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {reasons.map((row, index) => (
              <TableRow key={row._id} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.reason}</TableCell>
                <TableCell>{row.userType}</TableCell>
                <TableCell>
                  <span className="px-3 py-1 border border-green-500 text-green-500 rounded text-sm">
                    {row.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(row._id)}
                      >
                        <EditNoteIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(row._id)}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ===== REUSABLE CONFIRM DELETE ===== */}
      <ConfirmDeleteDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Cancellation Reason"
        description="Are you sure you want to delete this cancellation reason? This action cannot be undone."
      />
    </div>
  );
};

export default CancellationTable;

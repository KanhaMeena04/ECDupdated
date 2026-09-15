import React, { useState } from "react";
import {
  Edit,
  Delete,
  ArrowDropUp,
  ArrowDropDown,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { usePromocodeList } from "../../api/promocode.js";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

export default function PromocodeTable() {
  const navigate = useNavigate();
  const { promocodes, loading, error, deletePromocode } = usePromocodeList();

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleOpenDialog = (id) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedId(null);
  };

  const handleConfirmDelete = async () => {
    await deletePromocode(selectedId);
    handleCloseDialog();
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading promocodes...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  // ✅ CORRECT DATA EXTRACTION
  const list = Array.isArray(promocodes?.promocodes)
    ? promocodes.promocodes
    : [];

  if (list.length === 0) {
    return <div className="p-6 text-gray-500">No promocodes found.</div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="border p-3 w-10">#</th>
              {[
                "Promocode",
                "Restaurant",
                "Offer Type",
                "Discount",
                "Active Days",
                "Available From",
                "Expiry Date",
                "Usage/User",
                "Max Amount",
                "Payment Methods",
                "Status",
                "Action",
              ].map((h) => (
                <th key={h} className="border p-3 text-left font-semibold">
                  <div className="flex items-center gap-1">
                    {h}
                    <div className="flex flex-col leading-none text-gray-400">
                      <ArrowDropUp fontSize="small" />
                      <ArrowDropDown fontSize="small" />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {list.map((p, i) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="border p-3 text-center">{i + 1}</td>

                <td className="border p-3 font-medium text-teal-600">
                  {p.code}
                </td>

                <td className="border p-3">
                  {p.restaurant?.name?.en || "Admin"}
                </td>

                <td className="border p-3 capitalize">
                  {p.offerType === "percent"
                    ? "Percentage"
                    : p.offerType === "amount"
                    ? "Fixed Amount"
                    : p.offerType}
                </td>

                <td className="border p-3">
                  {p.offerType === "percent"
                    ? `${p.discountValue}%`
                    : p.discountValue}
                </td>

                <td className="border p-3">
                  {p.activeDays?.length ? p.activeDays.join(", ") : "All Days"}
                </td>

                <td className="border p-3">
                  {new Date(p.availableFrom).toLocaleDateString()}
                </td>

                <td className="border p-3">
                  {new Date(p.expiryDate).toLocaleDateString()}
                </td>

                <td className="border p-3">{p.usageLimitPerUser}</td>

                <td className="border p-3">{p.maxDiscountAmount}</td>

                <td className="border p-3">
                  {(p.paymentMethods || []).join(", ")}
                </td>

                <td className="border p-3">
                  <span className="border border-emerald-500 text-emerald-600 px-3 py-1 rounded-md text-xs font-medium">
                    {p.status}
                  </span>
                </td>

                <td className="border p-3">
                  <div className="flex gap-3 text-gray-600">
                    <Edit
                      className="cursor-pointer hover:text-black"
                      onClick={() =>
                        navigate(`/edit-promocode/${p._id}`, { state: p })
                      }
                    />
                    <Delete
                      className="cursor-pointer hover:text-red-500"
                      onClick={() => handleOpenDialog(p._id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DELETE CONFIRMATION */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Delete Promocode</DialogTitle>
        <DialogContent>
          Are you sure? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

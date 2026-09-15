import React, { useEffect, useMemo, useState } from "react";
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
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";

import { useFilterCategories } from "../../api/filtter";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";

const FilterSubCategoryTable = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [deleteState, setDeleteState] = useState({
    open: false,
    categoryId: null,
    subCategoryId: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    categories,
    fetchCategories,
    deleteSubCategory,
    loading,
  } = useFilterCategories({ autoFetch: false });

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const subCategoryData = useMemo(() => {
    if (!categories?.length) return [];

    return categories.flatMap((cat) =>
      (cat.subcategories || []).map((sub) => ({
        id: sub._id,
        name: sub.name,
        category: cat.name,
        categoryId: cat._id,
        isActive: sub.isActive,
      }))
    );
  }, [categories]);

  /* ================= SEARCH ================= */
  const filteredData = useMemo(() => {
    if (!searchTerm) return subCategoryData;

    return subCategoryData.filter(
      (row) =>
        row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, subCategoryData]);

  /* ================= ACTIONS ================= */
  const handleEdit = (row) => {
    navigate(`/filter-edit-sub-category/${row.id}`, {
      state: {
        categoryId: row.categoryId,
        subcategory: row,
      },
    });
  };

  const handleDeleteConfirm = async () => {
    const { categoryId, subCategoryId } = deleteState;
    if (!categoryId || !subCategoryId) return;

    setDeleteLoading(true);
    try {
      await deleteSubCategory(categoryId, subCategoryId);
      await fetchCategories();
    } catch (err) {
      console.error("Failed to delete subcategory", err);
    } finally {
      setDeleteLoading(false);
      setDeleteState({
        open: false,
        categoryId: null,
        subCategoryId: null,
      });
    }
  };

  /* ================= UI ================= */
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded shadow-sm border border-gray-200">

        {/* Search */}
        <div className="flex justify-end items-center p-4 gap-2">
          <label className="text-sm text-gray-500">Search</label>
          <input
            type="text"
            className="border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-teal-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow className="bg-white">
                <TableCell className="font-bold">#</TableCell>

                <TableCell>
                  <div className="flex items-center justify-between font-bold">
                    Name <UnfoldMoreIcon fontSize="small" className="text-gray-300" />
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-between font-bold">
                    Filter Category <UnfoldMoreIcon fontSize="small" className="text-gray-300" />
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-between font-bold">
                    Status <UnfoldMoreIcon fontSize="small" className="text-gray-300" />
                  </div>
                </TableCell>

                <TableCell align="right" className="font-bold">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.slice(0, rowsPerPage).map((row, index) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-gray-50 border-t border-gray-100"
                >
                  <TableCell className="font-bold text-gray-600">
                    {index + 1}
                  </TableCell>

                  <TableCell className="text-gray-600">
                    {row.name}
                  </TableCell>

                  <TableCell className="text-gray-600">
                    {row.category}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`text-[10px] px-3 py-1 rounded font-bold uppercase ${
                        row.isActive
                          ? "border border-green-500 text-green-600"
                          : "border border-gray-400 text-gray-500"
                      }`}
                    >
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEdit(row)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() =>
                          setDeleteState({
                            open: true,
                            categoryId: row.categoryId,
                            subCategoryId: row.id,
                          })
                        }
                      >
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && filteredData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-gray-400"
                  >
                    No subcategories found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-100 gap-4">
          <div className="flex items-center text-xs text-gray-400 gap-2">
            Showing 1 to
            <select
              className="border border-gray-200 rounded px-1 py-0.5 bg-white outline-none"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            of {filteredData.length} entries
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteState.open}
        title="Delete Subcategory"
        description="Are you sure you want to delete this subcategory?"
        loading={deleteLoading}
        onClose={() =>
          setDeleteState({
            open: false,
            categoryId: null,
            subCategoryId: null,
          })
        }
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default FilterSubCategoryTable;

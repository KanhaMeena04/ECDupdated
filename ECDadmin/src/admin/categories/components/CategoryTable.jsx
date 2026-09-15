import React, { useState } from "react";
import {
  Table, TableBody, TableCell,
  TableContainer, TableHead,
  TableRow, Paper, IconButton
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { useMasterCategory } from "../../api/category.js";
import { useNavigate } from "react-router-dom";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";

const CategoryTable = () => {
  const { categories, deleteCategory } = useMasterCategory();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (categories.length === 0) {
    return <div>No categories found. Add a category to see it here.</div>;
  }

  const handleEdit = (id) => {
    navigate(`/edit-categories/${id}`);
  };

  const handleDeleteClick = (category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;
    await deleteCategory(selectedCategory._id);
    setDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {categories.map((cat, i) => (
              <TableRow key={cat._id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{cat.name}</TableCell>
                <TableCell>{cat.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(cat._id)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteClick(cat)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {deleteDialogOpen && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          title={`Delete Category "${selectedCategory?.name}"?`}
          description="This action cannot be undone."
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
};

export default CategoryTable;

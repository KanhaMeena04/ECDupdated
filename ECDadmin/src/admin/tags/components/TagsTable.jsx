import React, { useState } from "react";
import {
  Table, TableBody, TableCell,
  TableContainer, TableHead,
  TableRow, Paper, IconButton, Chip
} from "@mui/material";
import { EditNote, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTags } from "../../api/tag.js";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";

const TagsTable = () => {
  const { tags, deleteTag } = useTags();
  const navigate = useNavigate();

  const [deleteId, setDeleteId] = useState(null);

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell> </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tags.map((tag, index) => (
              <TableRow key={tag._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{tag.name}</TableCell>
                <TableCell>{tag.type}</TableCell>
                <TableCell>
                  {tag.image && (
                    <img src={tag.image} className="w-10 h-10" />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={tag.status}
                    variant="outlined"
                    className={
                      tag.status === "active"
                        ? "border-green-500 text-green-500"
                        : "border-gray-400 text-gray-400"
                    }
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() =>
                      navigate(`/edit-tag/${tag._id}`)
                    }
                  >
                    <EditNote />
                  </IconButton>

                  <IconButton onClick={() => setDeleteId(tag._id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          deleteTag(deleteId);
          setDeleteId(null);
        }}
        title="Delete Tag"
        description="Are you sure you want to delete this tag?"
      />
    </>
  );
};

export default TagsTable;

import React, { useEffect, useState } from "react";
import { Edit, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import { useDocumentTypes } from "../../api/document";

const DocumentTable = () => {
  const navigate = useNavigate();
  const {
    documents,
    fetchDocumentTypes,
    deleteDocumentType,
  } = useDocumentTypes();

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ================= FETCH ON MOUNT ================= */
  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  /* ================= DIALOG ================= */
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
      await deleteDocumentType(selectedId);
      await fetchDocumentTypes();
    } finally {
      setDeleting(false);
      handleCloseDialog();
    }
  };

  return (
    <>
      <table className="w-full border border-gray-200 text-sm">
        {/* ===== TABLE HEADER ===== */}
        <thead className="bg-gray-50">
          <tr>
            <th className="border p-3 text-left"></th>
            <th className="border p-3 text-left">Document Name</th>
            <th className="border p-3 text-left">Document For</th>
            <th className="border p-3 text-left">Status</th>
            <th className="border p-3 text-left">Action</th>
          </tr>
        </thead>

        {/* ===== TABLE BODY ===== */}
        <tbody>
          {documents.map((doc, i) => {
            const isActive = doc.status === "active";

            return (
              <tr key={doc._id} className="hover:bg-gray-50">
                <td className="border p-3">{i + 1}</td>
                <td className="border p-3">{doc.name}</td>
                <td className="border p-3">{doc.type}</td>
                <td className="border p-3">
                  <span
                    className={`px-3 py-1 rounded text-xs font-medium border ${
                      isActive
                        ? "border-green-500 text-green-600"
                        : "border-red-500 text-red-600"
                    }`}
                  >
                    {doc.status}
                  </span>
                </td>
                <td className="border p-3">
                  <div className="flex gap-3">
                    <Edit
                      className="cursor-pointer hover:text-black"
                      onClick={() =>
                        navigate(`/edit-document/${doc._id}`)
                      }
                    />
                    <Delete
                      className="cursor-pointer text-red-500"
                      onClick={() => handleOpenDialog(doc._id)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ConfirmDeleteDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Document"
        description="Are you sure you want to delete this document? This action cannot be undone."
      />
    </>
  );
};

export default DocumentTable;

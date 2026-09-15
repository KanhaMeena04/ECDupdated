// import React, { useState } from 'react';
// import { 
//   DataGrid, 
//   gridClasses 
// } from '@mui/x-data-grid';
// import { 
//   Paper, 
//   IconButton, 
//   TextField, 
//   Select, 
//   MenuItem, 
//   Tabs, 
//   Tab, 
//   Box, 
//   Button 
// } from '@mui/material';
// import { Edit3, Image as ImageIcon, Languages } from 'lucide-react';

// const columns = [
//   { field: 'id', headerName: '', width: 60, align: 'center' },
//   { field: 'name', headerName: 'Name', flex: 1 },
//   { 
//     field: 'status', 
//     headerName: 'Status', 
//     width: 150,
//     renderCell: (params) => {
//       const isActive = params.value === 'Active';
//       return (
//         <button className={`px-4 py-1 rounded border text-xs font-medium transition-colors ${
//           isActive 
//             ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-50' 
//             : 'border-orange-400 text-orange-400 hover:bg-orange-50'
//         }`}>
//           {params.value}
//         </button>
//       );
//     }
//   },
//   {
//     field: 'action',
//     headerName: 'Action',
//     width: 100,
//     sortable: false,
//     renderCell: () => (
//       <IconButton size="small" className="text-gray-400 hover:text-gray-600">
//         <Edit3 size={18} />
//       </IconButton>
//     ),
//   },
// ];

// const rows = [
//   { id: 1, name: 'Keto ðŸ“¦', status: 'Inactive' },
//   { id: 2, name: 'Wallet Friendly ðŸ’°', status: 'Inactive' },
//   { id: 3, name: 'Kebap ðŸŒ®', status: 'Inactive' },
//   { id: 4, name: 'Test Group1', status: 'Active' },
// ];

// export default function GroupDashboard() {
//   const [tabValue, setTabValue] = useState(0);

//   return (
//     <div className="p-8 bg-gray-50 min-h-screen space-y-8 font-sans">
      
//       {/* SECTION 1: FORM (Screenshot 144414) */}
//       <Paper elevation={0} className="p-6 border border-gray-200 rounded-md">
//         <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
//           <Tabs 
//             value={tabValue} 
//             onChange={(e, n) => setTabValue(n)}
//             TabIndicatorProps={{ style: { backgroundColor: '#248C70' } }}
//             sx={{ '& .Mui-selected': { color: '#248C70 !important' } }}
//           >
//             <Tab icon={<Languages size={16} />} iconPosition="start" label="English" className="capitalize" />
//             <Tab icon={<Languages size={16} />} iconPosition="start" label="Arabic" className="capitalize" />
//           </Tabs>
//         </Box>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
//           <div className="space-y-1">
//             <label className="text-xs text-gray-500 font-medium">Tag name</label>
//             <TextField fullWidth placeholder="Tag name" size="small" />
//           </div>
//           <div className="space-y-1">
//             <label className="text-xs text-gray-500 font-medium">Tag Description</label>
//             <TextField fullWidth placeholder="Tag Description" size="small" />
//           </div>
//           <div className="space-y-1">
//             <label className="text-xs text-gray-500 font-medium">Group</label>
//             <Select fullWidth size="small" displayEmpty defaultValue="">
//               <MenuItem value="">select Group</MenuItem>
//             </Select>
//           </div>
//           <div className="space-y-1">
//             <label className="text-xs text-gray-500 font-medium">Status</label>
//             <Select fullWidth size="small" displayEmpty defaultValue="">
//               <MenuItem value="">Select Status</MenuItem>
//               <MenuItem value="active">Active</MenuItem>
//               <MenuItem value="inactive">Inactive</MenuItem>
//             </Select>
//           </div>
//         </div>

//         <div className="mt-6 space-y-4">
//           <label className="text-xs text-gray-500 font-medium">Tag image</label>
//           <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center border border-gray-300">
//             <ImageIcon className="text-gray-400" size={40} />
//           </div>
//           <div className="flex flex-col gap-2">
//             <Button variant="contained" className="bg-[#248C70] hover:bg-[#1c6d57] normal-case w-fit shadow-none">
//               Choose a file
//             </Button>
//             <Button variant="contained" className="bg-[#248C70] hover:bg-[#1c6d57] normal-case w-24 shadow-none">
//               Save
//             </Button>
//           </div>
//         </div>
//       </Paper>

//       {/* SECTION 2: TABLE (Screenshot 143207/145207) */}
//       <Paper elevation={0} className="border border-gray-200 rounded-sm overflow-hidden">
//         <DataGrid
//           rows={rows}
//           columns={columns}
//           autoHeight
//           disableRowSelectionOnClick
//           hideFooter
//           sx={{
//             border: 'none',
//             [`& .${gridClasses.columnHeader}`]: {
//               backgroundColor: '#fff',
//               color: '#64748b',
//               borderBottom: '1px solid #f1f5f9',
//             },
//             [`& .${gridClasses.cell}`]: {
//               borderBottom: '1px solid #f1f5f9',
//               color: '#475569',
//             },
//           }}
//         />
//         {/* Custom Table Footer */}
//         <div className="p-4 flex justify-between items-center bg-white border-t border-gray-100 text-sm text-gray-500">
//           <div className="flex items-center gap-2">
//             Showing 1 to 
//             <select className="border border-gray-300 rounded px-1 py-0.5">
//               <option>10</option>
//             </select>
//             of {rows.length} entries
//           </div>
//           <div className="flex gap-1">
//             <button className="p-1 px-2 rounded bg-gray-100 text-gray-400">{'<'}</button>
//             <button className="p-1 px-3 rounded bg-[#248C70] text-white font-bold">1</button>
//             <button className="p-1 px-2 rounded bg-gray-100 text-gray-400">{'>'}</button>
//           </div>
//         </div>
//       </Paper>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { DataGrid, gridClasses } from "@mui/x-data-grid";
import { Paper, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Edit3, Trash2, Eye } from "lucide-react";
import { useGroups } from "../../api/group";
import { useNavigate } from "react-router-dom";
import { useDeleteAddon } from "../../api/addons";
export default function GroupTable() {
  const navigate=useNavigate()
  const { groups, loading, fetchGroups } = useGroups();
  const [viewGroup, setViewGroup] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  /* ---------- ACTION HANDLERS ---------- */
  const handleEdit = (id) => {
    navigate(`/edit-group/${id}`);
  };
  const {deleteGroup}=useDeleteAddon()
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      deleteGroup()
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleView = (id) => {
    const group = groups.find((g) => g._id === id);
    if (!group) return;
    setViewGroup(group);
  };

  const handleCloseView = () => setViewGroup(null);

  /* ---------- TABLE COLUMNS ---------- */
  const columns = [
    { field: "id", headerName: "", width: 50, align: "center" },
    { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
    { field: "description", headerName: "Description", flex: 1.5 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <button
          className={`px-4 py-1 rounded border text-xs font-medium bg-white ${
            params.value === "Active" ? "border-emerald-500 text-emerald-500" : "border-orange-400 text-orange-400"
          }`}
        >
          {params.value}
        </button>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 140,
      renderCell: (params) => (
        <div className="flex gap-2">
          <IconButton size="small" onClick={() => handleEdit(params.row.id)}>
            <Edit3 size={18} />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row.id)}>
            <Trash2 size={18} />
          </IconButton>
          <IconButton size="small" onClick={() => handleView(params.row.id)}>
            <Eye size={18} />
          </IconButton>
        </div>
      ),
    },
  ];

  const rowsData = groups.map((g) => ({
    id: g._id,
    name: g.name,
    description: g.description,
    status: g.isActive ? "Active" : "Inactive",
  }));

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8 font-sans">
      {/* --- TABLE SECTION --- */}
      <Paper elevation={0} className="border rounded-sm overflow-hidden bg-white shadow-sm">
        <DataGrid
          rows={rowsData}
          columns={columns}
          rowHeight={70}
          disableRowSelectionOnClick
          hideFooter
          loading={loading}
          sx={{
            border: "none",
            [`& .${gridClasses.columnHeader}`]: { backgroundColor: "#fff", color: "#64748b", fontWeight: "bold", borderBottom: "1px solid #f1f5f9" },
            [`& .${gridClasses.cell}`]: { borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center" },
          }}
        />
      </Paper>

      {/* --- VIEW DIALOG --- */}
      {viewGroup && (
        <Dialog open onClose={handleCloseView}>
          <DialogTitle>View Group</DialogTitle>
          <DialogContent dividers>
            <p><strong>Name:</strong> {viewGroup.name}</p>
            <p><strong>Description:</strong> {viewGroup.description}</p>
            <p><strong>Status:</strong> {viewGroup.isActive ? "Active" : "Inactive"}</p>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseView}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

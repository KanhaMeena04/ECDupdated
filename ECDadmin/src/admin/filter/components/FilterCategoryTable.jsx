// import React, { useState } from 'react';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   TextField,
//   Pagination,
//   IconButton,
//   Chip,
//   Select,
//   MenuItem
// } from '@mui/material';
// import EditNoteIcon from '@mui/icons-material/EditNote';
// import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

// const initialData = [
//   { id: 1, name: 'Top Rated', icon: '⭐', status: 'Active' },
//   { id: 2, name: 'Free Delivery', icon: '🛵', status: 'Active' },
//   { id: 3, name: 'Favorite', icon: '❤️', status: 'Active' },
//   { id: 4, name: 'Budget friendly', icon: '💰', status: 'Active' },
//   { id: 5, name: 'Offers', icon: '🎁', status: 'Active' },
//   { id: 6, name: 'Veg', icon: '🌱', status: 'Active' },
// ];

// const FilterCategoryTable = () => {
//   const [page, setPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [searchTerm, setSearchTerm] = useState('');

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        
//         {/* Search Header */}
//         <div className="flex justify-end items-center p-4 gap-2">
//           <label className="text-sm text-gray-500">Search</label>
//           <input 
//             type="text" 
//             className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         {/* Table Container */}
//         <TableContainer component={Paper} elevation={0} className="border-t border-gray-100">
//           <Table sx={{ minWidth: 650 }}>
//             <TableHead className="bg-white">
//               <TableRow>
//                 <TableCell className="w-16 border-r border-gray-100">#</TableCell>
//                 <TableCell className="border-r border-gray-100">
//                   <div className="flex items-center justify-between font-bold text-gray-700">
//                     Name <UnfoldMoreIcon fontSize="small" className="text-gray-300" />
//                   </div>
//                 </TableCell>
//                 <TableCell className="border-r border-gray-100">
//                   <div className="flex items-center justify-between font-bold text-gray-700">
//                     Status <UnfoldMoreIcon fontSize="small" className="text-gray-300" />
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <div className="flex items-center justify-between font-bold text-gray-700">
//                     Action <UnfoldMoreIcon fontSize="small" className="text-gray-300" />
//                   </div>
//                 </TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {initialData.map((row) => (
//                 <TableRow key={row.id} className="hover:bg-gray-50">
//                   <TableCell className="border-r border-gray-100 font-bold">{row.id}</TableCell>
//                   <TableCell className="border-r border-gray-100">
//                     <span className="mr-2">{row.icon}</span> 
//                     <span className="text-gray-600 font-medium">{row.name}</span>
//                   </TableCell>
//                   <TableCell className="border-r border-gray-100">
//                     <button className="border border-green-500 text-green-500 px-3 py-1 rounded text-xs font-medium hover:bg-green-50 transition-colors">
//                       {row.status}
//                     </button>
//                   </TableCell>
//                   <TableCell>
//                     <IconButton size="small" className="text-gray-400">
//                       <EditNoteIcon />
//                     </IconButton>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>

//         {/* Footer / Pagination Section */}
//         <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-100 gap-4">
//           <div className="flex items-center text-sm text-gray-500 gap-2">
//             Showing 1 to 
//             <select 
//               className="border border-gray-300 rounded px-1 py-0.5 bg-white focus:outline-none"
//               value={rowsPerPage}
//               onChange={(e) => setRowsPerPage(e.target.value)}
//             >
//               <option value={10}>10</option>
//               <option value={25}>25</option>
//             </select>
//             of {initialData.length} entries
//           </div>
          
//           <div className="flex gap-1">
//              <button className="px-2 py-1 text-gray-400 hover:bg-gray-100 rounded">&lt;</button>
//              <button className="px-3 py-1 bg-teal-600 text-white rounded-full text-sm">1</button>
//              <button className="px-2 py-1 text-gray-400 hover:bg-gray-100 rounded">&gt;</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FilterCategoryTable;


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
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { useNavigate } from "react-router-dom";
import { useFilterCategories } from "../../api/filtter";

const FilterCategoryTable = () => {
  const navigate = useNavigate();

  const {
    categories,
    total,
    loading,
    error,
    fetchCategories,
  } = useFilterCategories();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchCategories({
      page,
      limit: rowsPerPage,
    });
  }, [page, rowsPerPage,  fetchCategories]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">

      

        <TableContainer component={Paper} elevation={0} className="border-t border-gray-100">
          <Table sx={{ minWidth: 650 }}>
            <TableHead className="bg-white">
              <TableRow>
                <TableCell className="w-16 border-r border-gray-100 font-bold">
                  
                </TableCell>

                <TableCell className="border-r border-gray-100">
                  <div className="flex items-center justify-between font-bold text-gray-700">
                    Name <UnfoldMoreIcon fontSize="small" className="text-gray-300" />
                  </div>
                </TableCell>

                <TableCell className="border-r border-gray-100">
                  <div className="flex items-center justify-between font-bold text-gray-700">
                    Status <UnfoldMoreIcon fontSize="small" className="text-gray-300" />
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-between font-bold text-gray-700">
                    Action <UnfoldMoreIcon fontSize="small" className="text-gray-300" />
                  </div>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {categories.map((row, index) => (
                <TableRow
                  key={row._id}
                  className="hover:bg-gray-50 border-t border-gray-100"
                >
                  <TableCell className="border-r border-gray-100 font-bold">
                    {(page - 1) * rowsPerPage + index + 1}
                  </TableCell>

                  <TableCell className="border-r border-gray-100 text-gray-600 font-medium">
                    {row.name}
                  </TableCell>

                  <TableCell className="border-r border-gray-100">
                    <button
                      className={`px-3 py-1 rounded text-xs font-medium border
                        ${
                          row.isActive
                            ? "border-green-500 text-green-500"
                            : "border-red-500 text-red-500"
                        }`}
                    >
                      {row.isActive ? "Active" : "Inactive"}
                    </button>
                  </TableCell>

                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(`/filter-edit-category/${row._id}`)
                      }
                    >
                      <EditNoteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-gray-400">
                    No filter categories found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-100 gap-4">
          <div className="flex items-center text-sm text-gray-500 gap-2">
            Showing {(page - 1) * rowsPerPage + 1} to{" "}
            {Math.min(page * rowsPerPage, total)} of {total} entries
          </div>

          <div className="flex items-center gap-2">
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-40"
            >
              &lt;
            </button>

            <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-sm">
              {page}
            </span>

            <button
              disabled={page * rowsPerPage >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-40"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterCategoryTable;

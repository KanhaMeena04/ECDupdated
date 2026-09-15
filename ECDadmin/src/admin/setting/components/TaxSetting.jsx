import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

const taxData = [
  { id: 1, name: 'VAT', status: 'Active' },
  { id: 2, name: 'SGST', status: 'Active' },
  { id: 3, name: 'IGST', status: 'Inactive' },
];

const TaxSetting = () => {
  const [rowsPerPage, setRowsPerPage] = useState(10);

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Table Header / Action Bar */}
        <div className="flex justify-between items-center p-4 border-b border-gray-50">
           <Typography variant="body2" className="text-gray-400 font-medium italic">
             * Note: Status determines if tax is applicable globally.
           </Typography>
        </div>

        {/* Table Content */}
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow className="bg-white">
                <TableCell className="w-16 border-r border-gray-100 font-bold text-gray-700">#</TableCell>
                <TableCell className="border-r border-gray-100">
                  <div className="flex items-center justify-between font-bold text-gray-700">
                    Tax Name <UnfoldMoreIcon fontSize="small" className="text-gray-300" />
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
              {taxData.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="border-r border-gray-100 font-bold text-gray-500">
                    {row.id}
                  </TableCell>
                  <TableCell className="border-r border-gray-100 text-[#00a689] font-medium cursor-pointer hover:underline">
                    {row.name}
                  </TableCell>
                  <TableCell className="border-r border-gray-100">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      row.status === 'Active' 
                        ? 'bg-green-50 text-green-500 border border-green-200' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" className="text-gray-400">
                      <EditNoteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer / Pagination */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-100 gap-4">
          <div className="flex items-center text-xs text-gray-400 gap-2">
            Showing 1 to 
            <select 
              className="border border-gray-200 rounded px-1 py-0.5 bg-white outline-none"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(e.target.value)}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            of {taxData.length} entries
          </div>
          
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:bg-gray-100">&lt;</button>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-[#00a689] text-white text-xs font-bold">1</button>
            <button className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:bg-gray-100">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxSetting; 
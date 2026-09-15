import React, { useState, useMemo } from 'react';
import { DataGrid, gridClasses } from '@mui/x-data-grid';
import { Paper, Box } from '@mui/material';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PayoutTable = ({ 
  data = [], 
  columns = [], 
  searchPlaceholder = "Search...", 
  rowHeight = 75 
}) => {
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);

  // Filter logic: Checks all keys in the object for a match
  const filteredRows = useMemo(() => {
    if (!searchText) return data;
    return data.filter((row) =>
      Object.values(row).some((val) =>
        val?.toString().toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [data, searchText]);

  return (
    <Paper elevation={0} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-100 flex justify-end items-center bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#248C70] w-64"
          />
        </div>
      </div>

      {/* Data Grid */}
      <DataGrid
        rows={filteredRows}
        columns={columns}
        rowHeight={rowHeight}
        autoHeight
        disableRowSelectionOnClick
        hideFooter
        sx={{
          border: 'none',
          [`& .${gridClasses.columnHeader}`]: {
            backgroundColor: '#fff',
            color: '#475569',
            fontWeight: 800,
            fontSize: '0.85rem',
            borderBottom: '1px solid #f1f5f9',
          },
          [`& .${gridClasses.cell}`]: {
            borderBottom: '1px solid #f1f5f9',
            color: '#64748b',
            fontSize: '0.875rem',
          },
          '& .MuiDataGrid-columnSeparator': { display: 'none' },
        }}
      />

      {/* Pagination Footer */}
      <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-white border-t border-gray-100 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          Showing {filteredRows.length > 0 ? 1 : 0} to 
          <select 
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-200 rounded px-1.5 py-1 bg-white outline-none focus:border-[#248C70]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          of {filteredRows.length} entries
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded bg-gray-50 text-gray-300 hover:bg-gray-100"><ChevronLeft size={16} /></button>
          <button className="w-8 h-8 flex items-center justify-center rounded bg-[#248C70] text-white font-bold text-sm">1</button>
          <button className="p-2 rounded bg-gray-50 text-gray-300 hover:bg-gray-100"><ChevronRight size={16} /></button>
        </div>
      </div>
    </Paper>
  );
};

export default PayoutTable;
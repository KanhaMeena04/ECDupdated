import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Button, TextField 
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

const ReportTable = ({ title, columns, data, showSummary = false, summaryData = {} }) => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex gap-2">
          <Button variant="contained" color="success" startIcon={<FileDownloadIcon />} className="capitalize">
            Export
          </Button>
          <Button variant="contained" color="primary" startIcon={<FilterAltIcon />} className="capitalize">
            Date Filter
          </Button>
        </div>
        <TextField size="small" placeholder="Search..." variant="outlined" className="bg-white w-64" />
      </div>

      {/* Summary Section (For Profit/Loss and Order Reports) */}
      {showSummary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 text-sm">
          {Object.entries(summaryData).map(([key, value]) => (
            <div key={key} className="bg-white p-3 rounded shadow-sm border-l-4 border-green-500">
              <p className="text-gray-500 uppercase text-xs font-bold">{key.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Data Table */}
      <TableContainer component={Paper} className="shadow-md overflow-x-auto">
        <Table stickyHeader sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow className="bg-gray-100">
              {columns.map((col) => (
                <TableCell key={col} className="font-bold text-gray-700">{col}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} hover>
                {Object.values(row).map((val, i) => (
                  <TableCell key={i}>{val}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ReportTable;
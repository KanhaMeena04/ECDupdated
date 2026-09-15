import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Skeleton, TextField, Button, Typography, Box, 
  Pagination, Select, MenuItem 
} from '@mui/material';
import { Edit, Delete, Add, ChevronLeft, ChevronRight } from '@mui/icons-material';

const DataTable = ({ 
  title, 
  columns = [], 
  data = [], 
  loading, 
  onAdd, 
  onEdit, 
  onDelete,
  totalEntries = 0 // Total count from backend
}) => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
    // If using backend pagination, call your API here
  };

  return (
    <Box sx={{ 
      width: '100%', 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      border: '1px solid #e5e7eb', 
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      overflow: 'hidden' 
    }}>
      
     

      {/* Table Content */}
      <TableContainer>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f9fafb' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#374151', paddingY: 1.5 }}>#</TableCell>
              {columns.map((col) => (
                <TableCell key={col.field} sx={{ fontWeight: 600, color: '#374151' }}>
                  {col.headerName}
                </TableCell>
              ))}
              <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  {columns.map((_, index) => (
                    <TableCell key={`cell-skeleton-${index}`}><Skeleton variant="text" /></TableCell>
                  ))}
                  <TableCell><Skeleton variant="text" /></TableCell>
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row, index) => (
                <TableRow key={row.id || index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{(page - 1) * rowsPerPage + (index + 1)}</TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.field} sx={{ color: '#4b5563' }}>
                      {col.render ? col.render(row[col.field], row) : (row[col.field] || '-')}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton size="small" onClick={() => onEdit?.(row)} sx={{ border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                        <Edit fontSize="small" sx={{ color: '#6b7280' }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => onDelete?.(row)} sx={{ border: '1px solid #e5e7eb', borderRadius: '4px', color: '#ef4444' }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center" sx={{ paddingY: 10, color: '#9ca3af' }}>
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Footer (Matches your Images) */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 2, 
        borderTop: '1px solid #e5e7eb',
        gap: 2
      }}>
        {/* Left Side: Entry count info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>
            Showing 1 to
          </Typography>
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(e.target.value)}
            sx={{ 
              height: '32px', 
              fontSize: '0.85rem',
              '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #e5e7eb' }
            }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>
            of {totalEntries || data.length} entries
          </Typography>
        </Box>

        {/* Right Side: Page Numbers */}
        <Pagination 
          count={Math.ceil((totalEntries || data.length) / rowsPerPage)} 
          page={page} 
          onChange={handlePageChange}
          variant="outlined" 
          shape="rounded"
          size="small"
          renderItem={(item) => (
            <Box component={Pagination} {...item} sx={{
              '& .Mui-selected': {
                backgroundColor: '#248C70 !important',
                color: 'white !important',
                border: 'none'
              }
            }} />
          )}
          sx={{
            '& .MuiPaginationItem-root': {
              borderRadius: '50%', // Makes buttons circular like in your screenshots
              fontSize: '0.85rem',
              color: '#6b7280',
              border: '1px solid #e5e7eb'
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default DataTable;
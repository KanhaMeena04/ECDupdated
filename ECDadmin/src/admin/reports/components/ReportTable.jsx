import React, { useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Button, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Chip, CircularProgress
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ClearIcon from '@mui/icons-material/Clear';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PaymentsIcon from '@mui/icons-material/Payments';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

const ReportTable = ({ title = "Reports & Analytics", columns = [], data = [], loading = false, error = "", showSummary = false, summaryData = {} }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDateLabel, setActiveDateLabel] = useState('');

  // Search & Date Filter Logic
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Search filter
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        matchesSearch = Object.values(row).some((val) =>
          String(val || '').toLowerCase().includes(q)
        );
      }

      // 2. Date filter (if row has date field or timestamp)
      let matchesDate = true;
      if (startDate || endDate) {
        const rowDateStr = row.date || row.createdAt || row.time;
        if (rowDateStr) {
          const rowTime = new Date(rowDateStr).getTime();
          if (startDate) {
            const startTime = new Date(startDate).setHours(0, 0, 0, 0);
            if (rowTime < startTime) matchesDate = false;
          }
          if (endDate) {
            const endTime = new Date(endDate).setHours(23, 59, 59, 999);
            if (rowTime > endTime) matchesDate = false;
          }
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [data, searchQuery, startDate, endDate]);

  // Export CSV Functionality
  const handleExportCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      alert("No data available to export!");
      return;
    }

    const headers = columns.join(",");
    const rows = filteredData.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${(title || 'report').toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Date Quick Presets
  const applyPreset = (preset) => {
    const today = new Date();
    if (preset === 'today') {
      const dateStr = today.toISOString().slice(0, 10);
      setStartDate(dateStr);
      setEndDate(dateStr);
      setActiveDateLabel('Today');
    } else if (preset === '7days') {
      const prior = new Date(today);
      prior.setDate(today.getDate() - 7);
      setStartDate(prior.toISOString().slice(0, 10));
      setEndDate(today.toISOString().slice(0, 10));
      setActiveDateLabel('Last 7 Days');
    } else if (preset === '30days') {
      const prior = new Date(today);
      prior.setDate(today.getDate() - 30);
      setStartDate(prior.toISOString().slice(0, 10));
      setEndDate(today.toISOString().slice(0, 10));
      setActiveDateLabel('Last 30 Days');
    }
    setDateFilterOpen(false);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setActiveDateLabel('');
  };

  // Calculate Metrics from filtered data
  const totalAmount = useMemo(() => {
    return filteredData.reduce((acc, row) => {
      const amtStr = String(row.amount || row.billAmount || '0').replace(/[^0-9.]/g, '');
      const val = parseFloat(amtStr);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  }, [filteredData]);

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-7 space-y-6">
      {/* Top Header Card & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md">
            <AssessmentIcon />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Records</p>
            <h3 className="text-2xl font-bold text-gray-800">{filteredData.length} <span className="text-xs text-gray-400 font-normal">/ {data.length}</span></h3>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex items-center gap-4">
          <div className="p-3 bg-blue-500 text-white rounded-xl shadow-md">
            <PaymentsIcon />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Value / Amount</p>
            <h3 className="text-2xl font-bold text-blue-700">₹{totalAmount.toFixed(2)}</h3>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 flex items-center gap-4">
          <div className="p-3 bg-purple-500 text-white rounded-xl shadow-md">
            <ShoppingBagIcon />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Search & Filters</p>
            <div className="flex items-center gap-2 mt-1">
              {searchQuery ? (
                <Chip size="small" label={`Search: "${searchQuery}"`} onDelete={() => setSearchQuery('')} color="primary" variant="outlined" />
              ) : activeDateLabel || startDate ? (
                <Chip size="small" label={`Date: ${activeDateLabel || startDate}`} onDelete={clearDateFilter} color="secondary" variant="outlined" />
              ) : (
                <span className="text-sm font-semibold text-gray-600">All Live Data</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar: Export, Date Filter, Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/80 p-4 rounded-xl border border-gray-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="contained" 
            onClick={handleExportCSV}
            startIcon={<FileDownloadIcon />} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white capitalize font-semibold shadow-sm rounded-lg py-2 px-4"
            sx={{ bgcolor: '#00a67e', '&:hover': { bgcolor: '#008f6d' } }}
          >
            Export CSV
          </Button>

          <Button 
            variant="contained" 
            onClick={() => setDateFilterOpen(true)}
            startIcon={<FilterAltIcon />} 
            className="capitalize font-semibold shadow-sm rounded-lg py-2 px-4"
            sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            Date Filter
          </Button>

          {(startDate || endDate || activeDateLabel) && (
            <Chip 
              icon={<CalendarTodayIcon style={{ fontSize: 14 }} />}
              label={activeDateLabel || `${startDate} to ${endDate}`}
              onDelete={clearDateFilter}
              color="info"
              variant="filled"
              className="font-medium"
            />
          )}
        </div>

        {/* Real-time Search Field */}
        <TextField 
          size="small" 
          placeholder="Search reports..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined" 
          className="bg-white w-full sm:w-72" 
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" className="text-gray-400" />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <ClearIcon 
                  fontSize="small" 
                  className="text-gray-400 cursor-pointer hover:text-gray-600" 
                  onClick={() => setSearchQuery('')}
                />
              </InputAdornment>
            ) : null,
            sx: { borderRadius: '10px', fontSize: '0.875rem' }
          }}
        />
      </div>

      {/* Summary Section if provided */}
      {showSummary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          {Object.entries(summaryData).map(([key, value]) => (
            <div key={key} className="bg-white p-3 rounded-xl shadow-xs border border-gray-100 border-l-4 border-l-emerald-500">
              <p className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-base font-bold text-gray-800 mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Data Table */}
      <TableContainer component={Paper} className="shadow-none border border-gray-100 rounded-xl overflow-hidden">
        <Table stickyHeader sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell 
                  key={col} 
                  sx={{ bgcolor: '#f9fafb', fontWeight: '700', color: '#374151', fontSize: '0.8125rem', textTransform: 'uppercase', py: 2 }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length || 4} className="text-center py-12">
                  <CircularProgress size={32} sx={{ color: '#00a67e' }} />
                  <p className="text-gray-500 text-sm mt-2 font-medium">Fetching report details...</p>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length || 4} className="text-center py-8 text-red-500 font-semibold">
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <TableRow key={index} hover className="transition-colors hover:bg-gray-50/80">
                  {Object.values(row).map((val, i) => (
                    <TableCell key={i} sx={{ fontSize: '0.875rem', py: 1.75, color: i === 0 ? '#111827' : '#4b5563', fontWeight: i === 0 ? 600 : 400 }}>
                      {String(val)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length || 4} className="text-center py-10">
                  <p className="text-gray-500 font-semibold text-sm">
                    {searchQuery ? `No matching records found for "${searchQuery}"` : "No report records found"}
                  </p>
                  {searchQuery && (
                    <Button size="small" onClick={() => setSearchQuery('')} className="mt-2 text-emerald-600">
                      Clear Search Filter
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Date Filter Modal */}
      <Dialog open={dateFilterOpen} onClose={() => setDateFilterOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-bold text-gray-800 border-b flex justify-between items-center">
          <span>Filter by Date Range</span>
          <ClearIcon className="cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setDateFilterOpen(false)} />
        </DialogTitle>
        <DialogContent className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="small" variant="outlined" onClick={() => applyPreset('today')}>Today</Button>
            <Button size="small" variant="outlined" onClick={() => applyPreset('7days')}>Last 7 Days</Button>
            <Button size="small" variant="outlined" onClick={() => applyPreset('30days')}>Last 30 Days</Button>
          </div>

          <div className="pt-2 space-y-3">
            <div>
              <Typography variant="caption" className="font-bold text-gray-600">Start Date</Typography>
              <TextField 
                type="date" 
                fullWidth 
                size="small" 
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveDateLabel('');
                }}
                InputLabelProps={{ shrink: true }}
              />
            </div>
            <div>
              <Typography variant="caption" className="font-bold text-gray-600">End Date</Typography>
              <TextField 
                type="date" 
                fullWidth 
                size="small" 
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveDateLabel('');
                }}
                InputLabelProps={{ shrink: true }}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-4 border-t bg-gray-50">
          <Button onClick={clearDateFilter} color="inherit">Reset</Button>
          <Button variant="contained" onClick={() => setDateFilterOpen(false)} sx={{ bgcolor: '#00a67e', '&:hover': { bgcolor: '#008f6d' } }}>
            Apply Filter
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ReportTable;
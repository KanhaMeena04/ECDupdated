import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Select, MenuItem, LinearProgress, InputAdornment, IconButton, Tooltip
} from '@mui/material';
import { Search, X, RefreshCw, ChevronLeft, ChevronRight, UserCheck, ShieldAlert, Wallet, ExternalLink } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useUsers, useAddMoneyToWallet, useCODBlockUnblock } from '../../api/user.js';
import { useNavigate } from 'react-router-dom';
import TopupPopup from '../components/TopupPopup';

const UserManagement = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [openTopup, setOpenTopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [codLoadingId, setCodLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Debounce search query to prevent lag and focus loss while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1); // Reset to first page on search
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data, loading, error, refetch } =
    useUsers('customer', page, limit, search);

  const { addMoneyToWallet } = useAddMoneyToWallet();
  const { toggleCodBlock } = useCODBlockUnblock();

  const headers = [
    'Name',
    'Email',
    'Phone Number',
    'Login Type',
    'Created at',
    'Registered at',
    'Wallet',
    'Action',
  ];

  const handleToggleCod = async (user) => {
    const willBlock = !user.isCodBlocked;
    setCodLoadingId(user._id);
    try {
      await toggleCodBlock(user._id, willBlock);
      setActionMessage({
        type: 'success',
        text: `COD ${willBlock ? 'Blocked' : 'Unblocked'} for ${user.firstName || user.name || 'User'}`
      });
      setTimeout(() => setActionMessage(null), 3500);
      refetch();
    } catch (err) {
      console.error(err);
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to update COD status'
      });
      setTimeout(() => setActionMessage(null), 4000);
    } finally {
      setCodLoadingId(null);
    }
  };

  const handleTopupSubmit = async () => {
    if (!selectedUser) return;
    const amountNum = Number(topupAmount);
    if (!amountNum || amountNum <= 0) return;

    setTopupLoading(true);
    try {
      await addMoneyToWallet({
        userId: selectedUser._id,
        amount: amountNum,
      });

      setActionMessage({
        type: 'success',
        text: `₹${amountNum} added successfully to ${selectedUser.firstName || selectedUser.name || 'User'}'s wallet!`
      });
      setTimeout(() => setActionMessage(null), 3500);

      setOpenTopup(false);
      setTopupAmount('');
      setSelectedUser(null);
      refetch();
    } catch (err) {
      console.error(err);
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to top up wallet'
      });
      setTimeout(() => setActionMessage(null), 4000);
    } finally {
      setTopupLoading(false);
    }
  };

  const usersList = useMemo(() => {
    return Array.isArray(data?.users) ? data.users : [];
  }, [data]);

  const totalUsers = data?.total || usersList.length;
  const totalPages = Math.ceil(totalUsers / limit) || 1;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen font-sans">
      <PageHeader
        title="User Management"
        breadcrumbs={[{ label: 'User Management' }, { label: 'users', active: true }]}
      />

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm transition-all ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Filter and Controls Bar */}
      <div className="mb-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input with Debounce & Clear */}
        <div className="relative flex-1 max-w-md">
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, email, or mobile..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} className="text-gray-400" />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchInput('')}>
                    <X size={16} className="text-gray-400 hover:text-gray-600" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                fontSize: '0.875rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e5e7eb',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#10b981',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#10b981',
                  borderWidth: 2,
                }
              }
            }}
          />
        </div>

        {/* Right Controls: Refresh & Total Counter */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg">
            Total Users: <span className="text-emerald-600 font-bold">{totalUsers}</span>
          </div>

          <Tooltip title="Refresh list">
            <IconButton
              onClick={() => refetch()}
              disabled={loading}
              size="small"
              className="border border-gray-200 hover:bg-gray-50 text-gray-600"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-600' : ''} />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Main Table Card */}
      <TableContainer component={Paper} elevation={0} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
        {/* Subtle loading indicator that doesn't unmount table or lose focus */}
        {loading && (
          <LinearProgress 
            sx={{ 
              height: 3, 
              bgcolor: '#ecfdf5', 
              '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } 
            }} 
          />
        )}

        <Table sx={{ minWidth: 1000 }} size="small">
          <TableHead className="bg-gray-50/80 border-b border-gray-200">
            <TableRow>
              <TableCell className="font-bold border-r border-gray-200 w-12 text-center text-xs text-gray-500 uppercase tracking-wider py-3.5">
                #
              </TableCell>
              {headers.map((header) => (
                <TableCell 
                  key={header} 
                  className={`font-bold border-r border-gray-200 text-xs text-gray-600 uppercase tracking-wider py-3.5 ${
                    header === 'Action' ? 'text-center' : ''
                  }`}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {usersList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length + 1} className="text-center py-12 text-gray-500 text-sm">
                  {loading ? 'Searching users...' : search ? `No users found matching "${search}"` : 'No users found'}
                </TableCell>
              </TableRow>
            ) : (
              usersList.map((user, index) => {
                const displayName = user.firstName || user.lastName
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                  : user.name || 'User';
                const isCodBlocked = user.isCodBlocked === true || user.codActive === false;
                const isCodUpdating = codLoadingId === user._id;

                return (
                  <TableRow key={user._id} className="hover:bg-gray-50/70 transition-colors">
                    <TableCell className="border-r border-gray-200 text-center font-medium text-xs text-gray-400 py-3">
                      {(page - 1) * limit + index + 1}
                    </TableCell>

                    {/* Name */}
                    <TableCell className="border-r border-gray-200 text-gray-800 text-xs font-medium py-3">
                      <div className="font-semibold text-gray-900">{displayName}</div>
                      {(user.firstName || user.lastName) && (
                        <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                          First: <span className="font-medium text-gray-700">{user.firstName || '-'}</span> | Last: <span className="font-medium text-gray-700">{user.lastName || '-'}</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Email */}
                    <TableCell className="border-r border-gray-200 text-gray-600 text-xs py-3">
                      {user.email || 'N/A'}
                    </TableCell>

                    {/* Phone Number */}
                    <TableCell className="border-r border-gray-200 text-gray-600 text-xs py-3 font-mono">
                      {user.mobile || user.phone || 'N/A'}
                    </TableCell>

                    {/* Login Type */}
                    <TableCell className="border-r border-gray-200 text-gray-600 text-xs py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 capitalize">
                        {user.type || 'web'}
                      </span>
                    </TableCell>

                    {/* Created at */}
                    <TableCell className="border-r border-gray-200 text-gray-600 text-xs py-3 whitespace-nowrap">
                      {user.createdAt ? new Date(user.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                    </TableCell>

                    {/* Registered at */}
                    <TableCell className="border-r border-gray-200 text-gray-600 text-xs py-3 whitespace-nowrap">
                      {user.registeredAt || (user.createdAt ? new Date(user.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A')}
                    </TableCell>

                    {/* Wallet */}
                    <TableCell className="border-r border-gray-200 text-xs font-semibold py-3">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 font-mono">
                        {user.wallet || `₹${(user.walletBalance || 0).toFixed(2)}`}
                      </span>
                    </TableCell>

                    {/* Action Buttons */}
                    <TableCell className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Add Wallet Button */}
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setTopupAmount('');
                            setOpenTopup(true);
                          }}
                          variant="outlined"
                          size="small"
                          sx={{
                            color: '#059669',
                            borderColor: '#a7f3d0',
                            backgroundColor: '#f0fdf4',
                            '&:hover': {
                              backgroundColor: '#dcfce7',
                              borderColor: '#10b981',
                            },
                            fontSize: '11px',
                            fontWeight: 600,
                            px: 1.2,
                            py: 0.4,
                            textTransform: 'none',
                            borderRadius: '8px',
                          }}
                        >
                          Add Wallet
                        </Button>

                        {/* Block/Unblock COD Button */}
                        <Button
                          onClick={() => handleToggleCod(user)}
                          disabled={isCodUpdating}
                          variant="outlined"
                          size="small"
                          sx={{
                            color: isCodBlocked ? '#dc2626' : '#2563eb',
                            borderColor: isCodBlocked ? '#fecaca' : '#bfdbfe',
                            backgroundColor: isCodBlocked ? '#fef2f2' : '#eff6ff',
                            '&:hover': {
                              backgroundColor: isCodBlocked ? '#fee2e2' : '#dbeafe',
                              borderColor: isCodBlocked ? '#ef4444' : '#3b82f6',
                            },
                            fontSize: '11px',
                            fontWeight: 600,
                            px: 1.2,
                            py: 0.4,
                            textTransform: 'none',
                            borderRadius: '8px',
                          }}
                        >
                          {isCodUpdating ? 'Updating...' : isCodBlocked ? 'Unblock COD' : 'Block COD'}
                        </Button>

                        {/* View User */}
                        <Button
                          onClick={() => navigate(`/user-profile/${user._id}`)}
                          variant="outlined"
                          size="small"
                          sx={{
                            color: '#4b5563',
                            borderColor: '#e5e7eb',
                            backgroundColor: '#f9fafb',
                            '&:hover': {
                              backgroundColor: '#f3f4f6',
                              borderColor: '#9ca3af',
                            },
                            fontSize: '11px',
                            fontWeight: 600,
                            px: 1.2,
                            py: 0.4,
                            textTransform: 'none',
                            borderRadius: '8px',
                          }}
                        >
                          View User
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Table Footer with Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 border-t border-gray-200 bg-gray-50/50 text-xs text-gray-600 gap-3">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              size="small"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              sx={{
                fontSize: '12px',
                height: 28,
                '& .MuiSelect-select': { py: 0.5, px: 1 },
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
            <span className="text-gray-400">|</span>
            <span>
              Showing {usersList.length > 0 ? (page - 1) * limit + 1 : 0} -{' '}
              {Math.min(page * limit, totalUsers)} of {totalUsers}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="small"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              startIcon={<ChevronLeft size={16} />}
              sx={{ textTransform: 'none', fontSize: '12px' }}
            >
              Previous
            </Button>
            <span className="font-semibold px-2 py-0.5 bg-white border border-gray-200 rounded">
              {page} / {totalPages}
            </span>
            <Button
              size="small"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              endIcon={<ChevronRight size={16} />}
              sx={{ textTransform: 'none', fontSize: '12px' }}
            >
              Next
            </Button>
          </div>
        </div>
      </TableContainer>

      {/* TOPUP POPUP — ENHANCED UI WITHOUT VIDEO TUTORIAL */}
      <TopupPopup
        open={openTopup}
        onClose={() => {
          if (!topupLoading) {
            setOpenTopup(false);
            setSelectedUser(null);
            setTopupAmount('');
          }
        }}
        amount={topupAmount}
        onAmountChange={setTopupAmount}
        onSubmit={handleTopupSubmit}
        user={selectedUser}
        loading={topupLoading}
      />
    </div>
  );
};

export default UserManagement;

import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Select, MenuItem
} from '@mui/material';
import { PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useUsers, useAddMoneyToWallet, useCODBlockUnblock } from '../../api/user.js';
import { useNavigate } from 'react-router-dom';
import TopupPopup from '../components/TopupPopup';

const UserManagement = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');

  const [openTopup, setOpenTopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  

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
    try {
      await toggleCodBlock(user._id, !user.isCodBlocked);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTopupSubmit = async () => {
    if (!selectedUser) return;
    if (!topupAmount || Number(topupAmount) <= 0) return;

    try {
      await addMoneyToWallet({
        userId: selectedUser._id,
        amount: Number(topupAmount),
      });

      setOpenTopup(false);
      setTopupAmount('');
      setSelectedUser(null);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4 bg-gray-50 min-h-screen font-sans">
      <PageHeader
        title="User Management"
        breadcrumbs={[{ label: 'User Management' }, { label: 'users', active: true }]}
      />

      <div className="flex justify-end mb-4">
        <button className="flex items-center gap-2 bg-orange-100 text-orange-600 px-3 py-1.5 rounded text-sm font-medium border border-orange-200">
          <PlayCircle size={16} />
          Video Tutorial
        </button>
      </div>

      <TableContainer component={Paper} elevation={0} className="border border-gray-200 rounded-sm">
        <Table sx={{ minWidth: 1200 }} size="small">
          <TableHead className="bg-white">
            <TableRow>
              <TableCell className="font-bold border-r w-12 text-center"></TableCell>
              {headers.map((header) => (
                <TableCell key={header} className="font-bold border-r text-gray-700">
                  <div className="mb-2">{header}</div>
                  {header !== 'Action' && (
                    <TextField
                      placeholder={`Search ${header}`}
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', padding: '6px' } }}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {data.users.map((user, index) => (
              <TableRow key={user._id} className="hover:bg-gray-50">
                <TableCell className="border-r text-center font-medium">{index + 1}</TableCell>
                <TableCell className="border-r text-gray-600 text-xs">{user.name}</TableCell>
                <TableCell className="border-r text-gray-600 text-xs">{user.email}</TableCell>
                <TableCell className="border-r text-gray-600 text-xs">{user.mobile}</TableCell>
                <TableCell className="border-r text-gray-600 text-xs">{user.type || 'web'}</TableCell>
                <TableCell className="border-r text-gray-600 text-xs">
                  {new Date(user.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="border-r text-gray-600 text-xs">
                  {user.registeredAt || ''}
                </TableCell>
                <TableCell className="border-r text-gray-600 text-xs font-semibold">
                  {user.wallet || 'RM 0.00'}
                </TableCell>

                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => {
                        setSelectedUser(user);
                        setOpenTopup(true);
                      }}
                      variant="outlined"
                      size="small"
                      sx={{
                        color: '#10b981',
                        borderColor: '#10b981',
                        fontSize: '10px',
                        px: 1,
                        textTransform: 'none',
                      }}
                    >
                      Add Wallet
                    </Button>

                    <Button
                      onClick={() => handleToggleCod(user)}
                      variant="outlined"
                      size="small"
                      sx={{
                        color: user.isCodBlocked ? '#ef4444' : '#10b981',
                        borderColor: user.isCodBlocked ? '#ef4444' : '#10b981',
                        fontSize: '10px',
                        px: 1,
                        textTransform: 'none',
                      }}
                    >
                      {user.isCodBlocked ? 'Unblock COD' : 'Block COD'}
                    </Button>

                    <Button
                      onClick={() => navigate(`/user-profile/${user._id}`)}
                      variant="outlined"
                      size="small"
                      sx={{
                        color: '#10b981',
                        borderColor: '#10b981',
                        fontSize: '10px',
                        px: 1,
                        textTransform: 'none',
                      }}
                    >
                      View User
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* POPUP — SAME UI, JUST COMPONENTIZED */}
      <TopupPopup
        open={openTopup}
        onClose={() => setOpenTopup(false)}
        amount={topupAmount}
        onAmountChange={setTopupAmount}
        onSubmit={handleTopupSubmit}
      />
    </div>
  );
};

export default UserManagement;

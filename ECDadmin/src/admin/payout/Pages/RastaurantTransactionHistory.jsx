import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PageHeader from '../../components/PageHeader';
import PayoutTable from '../components/PayoutTable';
import { CircularProgress, Typography } from '@mui/material';
import { API_BASE_URL } from '../../../utils/utils';

function RastaurantTransactionHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/admin/transactions/restaurants`, {
          withCredentials: true,
        });
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch restaurant transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const columns = [
    { field: 'id', headerName: '#', width: 60 },
    { field: 'restaurant', headerName: 'Restaurant', flex: 1.5 },
    { field: 'total', headerName: 'Total', flex: 1 },
    { field: 'transactionId', headerName: 'Transaction ID', flex: 1 },
    { field: 'date', headerName: 'Date', flex: 1.5 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <span className="text-gray-500 text-sm">{params.value}</span>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Restaurant Transaction History"
        breadcrumbs={[
          { label: "Transaction History" },
          { label: "History", active: true }
        ]}
      />
      {loading ? (
        <div className="flex justify-center p-8"><CircularProgress style={{ color: '#248C70' }} /></div>
      ) : error ? (
        <Typography color="error" className="p-4">{error}</Typography>
      ) : (
        <PayoutTable data={rows} columns={columns} title="Restaurant Transaction History" />
      )}
    </div>
  );
}

export default RastaurantTransactionHistory;
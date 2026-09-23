import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PageHeader from '../../components/PageHeader';
import PayoutTable from '../components/PayoutTable';
import { CircularProgress, Typography } from '@mui/material';
import { API_BASE_URL } from '../../../utils/utils';

function DriverTransactionHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/admin/transactions/drivers`, {
          withCredentials: true,
        });
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch driver transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const columns = [
    { field: 'id', headerName: '#', width: 60 },
    { field: 'driver', headerName: 'Driver', flex: 1 },
    { field: 'total', headerName: 'Total', flex: 1 },
    { field: 'transactionId', headerName: 'Transaction ID', flex: 1 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => {
        const isSuccess = params.value === 'Success';
        return (
          <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
          }`}>
            {params.value}
          </span>
        );
      }
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Driver Transaction History"
        breadcrumbs={[
          { label: "Driver Transaction History" },
          { label: "Driver Transaction History", active: true }
        ]}
      />
      {loading ? (
        <div className="flex justify-center p-8"><CircularProgress style={{ color: '#248C70' }} /></div>
      ) : error ? (
        <Typography color="error" className="p-4">{error}</Typography>
      ) : (
        <PayoutTable data={rows} columns={columns} title="Driver Transaction History" />
      )}
    </div>
  );
}

export default DriverTransactionHistory;
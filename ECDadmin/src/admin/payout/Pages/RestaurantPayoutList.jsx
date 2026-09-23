import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PageHeader from '../../components/PageHeader';
import PayoutTable from '../components/PayoutTable';
import { Button, CircularProgress, Typography } from '@mui/material';
import { API_BASE_URL } from '../../../utils/utils';

function RastaurantTransactionHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/admin/payouts/restaurants`, {
          withCredentials: true,
        });
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch restaurant payouts');
      } finally {
        setLoading(false);
      }
    };
    fetchPayouts();
  }, []);

  const columns = [
    { field: 'id', headerName: '#', width: 60 },
    { field: 'restaurant', headerName: 'Restaurant', flex: 1.5 },
    { field: 'phone', headerName: 'Phone Number', flex: 1 },
    { field: 'totalOrders', headerName: 'Total Orders', flex: 0.8 },
    { field: 'totalToBePaid', headerName: 'Total To Be Paid', flex: 1 },
    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      renderCell: (params) => (
        <Button 
          variant="outlined" 
          size="small"
          className="border-[#248C70] text-[#248C70] hover:bg-emerald-50 normal-case text-[12px]"
          onClick={() => console.log("Paying restaurant:", params.row.restaurant)}
        >
          Make Payment
        </Button>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Restaurant Payout List"
        breadcrumbs={[
          { label: "Restaurant Payout List" },
          { label: "Restaurant Payout", active: true }
        ]}
      />
      {loading ? (
        <div className="flex justify-center p-8"><CircularProgress style={{ color: '#248C70' }} /></div>
      ) : error ? (
        <Typography color="error" className="p-4">{error}</Typography>
      ) : (
        <PayoutTable data={rows} columns={columns} title="Restaurant Payout" /> 
      )}
    </div>
  );
}

export default RastaurantTransactionHistory;
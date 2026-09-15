import React from 'react'
import PageHeader from '../../components/PageHeader'
import PayoutTable from '../components/PayoutTable'
import { Button } from '@mui/material';
function RastaurantTransactionHistory() {
  const columns = [
    { field: 'id', headerName: '', width: 50 },
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

  const rows = [
    { id: 1, restaurant: 'BBC - Chennai', phone: '**********', totalOrders: 37, totalToBePaid: 'RM -10432.56' },
    { id: 2, restaurant: 'MNC - Bengaluru', phone: '**********', totalOrders: 23, totalToBePaid: 'RM -11141.54' },
    { id: 3, restaurant: 'KFC', phone: '**********', totalOrders: 171, totalToBePaid: 'RM 26939.54' },
    { id: 4, restaurant: 'Jyran - Tandoor Dining & Lounge', phone: '**********', totalOrders: 12, totalToBePaid: 'RM 1156.61' },
    { id: 5, restaurant: 'MasalaWork', phone: '**********', totalOrders: 14, totalToBePaid: 'RM 262.96' },
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
<PayoutTable data={rows} columns={columns} title="Restaurant Payout" /> 
   </div>
  )
}

export default RastaurantTransactionHistory
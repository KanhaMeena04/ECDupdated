import React from 'react'
import PageHeader from '../../components/PageHeader'
import PayoutTable from '../components/PayoutTable'
import { Button } from '@mui/material';
function DriverPayout() {
	const columns = [
    { field: 'id', headerName: '', width: 50 },
    { field: 'driver', headerName: 'Driver', flex: 1 },
    { field: 'phone', headerName: 'Phone Number', flex: 1 },
    { field: 'totalOrders', headerName: 'Total Orders', flex: 1 },
    { field: 'totalToBePaid', headerName: 'Total To Be Paid', flex: 1 },
    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      renderCell: (params) => (
        <Button 
          variant="outlined" 
          size="small"
          sx={{ color: '#248C70', borderColor: '#248C70', textTransform: 'none', fontSize: '12px' }}
          onClick={() => console.log("Paying driver:", params.row.driver)}
        >
          Make Payment
        </Button>
      )
    }
  ];

  const rows = [
    { id: 1, driver: 'Hoang Ly', phone: '**********', totalOrders: 58, totalToBePaid: 'RM -14565.00' },
    { id: 2, driver: 'Canario', phone: '**********', totalOrders: 35, totalToBePaid: 'RM -46.00' },
    // ... add more data
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
				<PayoutTable data={rows} columns={columns} title="Driver Payout" />			 
			</div>
  )
}

export default DriverPayout
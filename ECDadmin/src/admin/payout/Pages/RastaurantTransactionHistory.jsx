import React from 'react'
import PageHeader from '../../components/PageHeader'
import PayoutTable from '../components/PayoutTable'
function RastaurantTransactionHistory() {
	const columns = [
    { field: 'id', headerName: '', width: 50 },
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

  const rows = [
    { id: 1, restaurant: 'BBC - Chennai', total: 'RM 5000.00', transactionId: 'Trans- 56', date: 'November 24th 2025, 2:57:47 am', status: 'Success' },
    { id: 2, restaurant: 'Pizza Duff Burger', total: 'RM 20.00', transactionId: 'Trans- 55', date: 'November 12th 2025, 9:46:02 pm', status: 'Success' },
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
		<PayoutTable data={rows} columns={columns} title="Restaurant Transaction History" />
						 
		</div>
  )
}

export default RastaurantTransactionHistory
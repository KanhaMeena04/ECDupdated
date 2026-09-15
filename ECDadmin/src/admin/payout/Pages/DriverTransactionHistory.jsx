import React from 'react'
import PageHeader from '../../components/PageHeader'
import PayoutTable from '../components/PayoutTable'

function DriverTransactionHistory() {
	const columns = [
    { field: 'id', headerName: '', width: 50 },
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

  const rows = [
    { id: 1, driver: '', total: 'RM 12.00', transactionId: 'Trans-097', status: 'Failed' },
    { id: 3, driver: 'Hoang Ly', total: 'RM 96.00', transactionId: 'Trans-097', status: 'Success' },
    { id: 6, driver: 'Faisal', total: 'RM 21.40', transactionId: 'driver-60550f35618d8', status: 'Success' },
  ];
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
				   <PageHeader
							title="Driver Transaction History"
							breadcrumbs={[
							  { label: "Driver Transaction History" },
							  { label: "Driver transaction History", active: true }
							]}
							/>
							<PayoutTable data={rows} columns={columns} title="Driver Transaction History" />
							 
			</div>
  )
}

export default DriverTransactionHistory
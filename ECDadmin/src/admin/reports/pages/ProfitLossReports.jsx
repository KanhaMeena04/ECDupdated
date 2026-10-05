import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import ReportTable from '../components/ReportTable';
import { useReports } from '../../api/reports';

function ProfitLossReports() {
  const columns = ["User", "Orders", "Amount"];
  const { reports, loading, error, fetchProfitLossReport } = useReports();

  useEffect(() => {
    fetchProfitLossReport({ page: 1, limit: 20 });
  }, [fetchProfitLossReport]);

  const data = reports.map(r => {
    let userName = 'N/A';
    if (typeof r.customer === 'object' && r.customer !== null) {
      userName = r.customer.name || 'N/A';
    } else if (typeof r.customer === 'string' && r.customer !== 'N/A') {
      userName = r.customer;
    } else {
      userName = r.user || r.userName || 'N/A';
    }

    const amt = typeof r.billAmount === 'number' ? r.billAmount : (typeof r.amount === 'number' ? r.amount : 0);

    return {
      user: userName,
      orders: r.orderId || r._id || '-',
      amount: `₹${amt.toFixed(2)}`
    };
  });

  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Reports & Analytics"
        breadcrumbs={[{ label: "Reports & Analytics Overview" }]}
      />
      <ReportTable title="Reports & Analytics" columns={columns} data={data} loading={loading} error={error} />
    </div>
  );
}

export default ProfitLossReports;

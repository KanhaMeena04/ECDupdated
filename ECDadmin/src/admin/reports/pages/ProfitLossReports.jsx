import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import ReportTable from '../components/ReportTable';
import { useReports } from '../../api/reports';

function ProfitLossReports() {
  const columns = ["User", "Phone Number", "Orders", "Amount"];
  const { reports, loading, error, fetchProfitLossReport } = useReports();

  useEffect(() => {
    fetchProfitLossReport({ page: 1, limit: 20 });
  }, [fetchProfitLossReport]);

  const data = reports.map(r => ({
    user: r.customer,
    phone: r.customer || 'N/A',
    orders: r.orderId || '-',
    amount: `RM ${r.billAmount?.toFixed(2) || '0.00'}`
  }));

  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Reports"
        breadcrumbs={[{ label: "Profit Loss Report" }]}
      />
      <ReportTable columns={columns} data={data} loading={loading} error={error} />
    </div>
  );
}

export default ProfitLossReports;

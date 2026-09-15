import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import ReportTable from '../components/ReportTable';
import { useReports } from '../../api/reports';

function TopUserReports() {
  const columns = ["User", "Phone Number", "Orders", "Amount"];
  const { reports, loading, error, fetchTopUsersReport } = useReports();

  useEffect(() => {
    fetchTopUsersReport({ limit: 20 });
  }, [fetchTopUsersReport]);

  const data = reports.map(r => ({
    user: r.name,
    phone: r.phone,
    orders: r.orders || 0,
    amount: `RM ${r.amount?.toFixed(2) || '0.00'}`
  }));

  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Top Users Report"
        breadcrumbs={[
          { label: "Top Users Report" },
          { label: "Top Users Report", active: true }
        ]}
      />
      <ReportTable columns={columns} data={data} loading={loading} error={error} />
    </div>
  );
}

export default TopUserReports;

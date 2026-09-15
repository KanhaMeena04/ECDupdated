import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import ReportTable from '../components/ReportTable';
import { useReports } from '../../api/reports';

function DeliveryPeopleReports() {
  const columns = ["Driver", "City", "Area", "Total Orders", "Total Earnings", "Pending Payouts"];
  const { reports, loading, error, fetchRiderReport } = useReports();

  useEffect(() => {
    fetchRiderReport({ page: 1, limit: 20 });
  }, [fetchRiderReport]);

  // map API data to table
  const data = reports.map(r => ({
    name: r.name,
    city: r.city,
    area: r.area || '-',
    orders: `RM ${r.totalOrders?.toFixed(2) || '0.00'}`,
    earnings: `RM ${r.totalEarnings?.toFixed(2) || '0.00'}`,
    pending: `RM ${r.pendingPayouts?.toFixed(2) || '0.00'}`
  }));

  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Delivery People Report"
        breadcrumbs={[
          { label: "Delivery People Report" },
          { label: "Delivery People Report", active: true }
        ]}
      />
      <ReportTable columns={columns} data={data} loading={loading} error={error} />
    </div>
  );
}

export default DeliveryPeopleReports;

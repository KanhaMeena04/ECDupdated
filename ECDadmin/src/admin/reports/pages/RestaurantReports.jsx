import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import ReportTable from '../components/ReportTable';
import { useReports } from '../../api/reports';

function RestaurantReports() {
  const columns = ["Restaurant", "Ratings", "Address", "Total Orders", "Earnings", "Payouts Completed"];
  const { reports, loading, error, fetchRestaurantReport } = useReports();

  useEffect(() => {
    fetchRestaurantReport({ page: 1, limit: 20 });
  }, [fetchRestaurantReport]);

  const data = (reports || []).map(r => ({
    name: typeof r.name === 'object' ? r.name.en || '-' : r.name || '-', // pick .en if object
    rating: '⭐'.repeat(Math.round(r.rating || 0)),
    address: typeof r.address === 'object' ? r.address.en || '-' : r.address || '-',
    orders: `RM ${Number(r.totalOrders || 0).toFixed(2)}`,
    earnings: `RM ${Number(r.totalEarnings || 0).toFixed(2)}`,
    payout: `RM ${Number(r.payoutsCompleted || 0).toFixed(2)}`
  }));

  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Restaurant Report"
        breadcrumbs={[
          { label: "Restaurant Report" },
          { label: "Restaurant Report", active: true }
        ]}
      />
      <ReportTable columns={columns} data={data} loading={loading} error={error} />
    </div>
  );
}

export default RestaurantReports;


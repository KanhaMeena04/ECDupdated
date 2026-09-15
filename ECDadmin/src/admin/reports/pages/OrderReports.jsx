import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import ReportTable from '../components/ReportTable';
import { useReports } from '../../api/reports';

function OrderReports() {
  const columns = ["User", "Phone Number", "Orders", "Amount"];
  const { reports, loading, error, fetchOrderReport } = useReports();

  useEffect(() => {
    fetchOrderReport({ page: 1, limit: 20 });
  }, [fetchOrderReport]);

  const data = reports.map(r => ({
    user: r.customerName,
    phone: r.customerPhone,
    orders: r.orderId,
    amount: `RM ${r.amount?.toFixed(2) || '0.00'}`
  }));

  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Order Report"
        breadcrumbs={[
          { label: "Order Report" },
          { label: "Order Report", active: true }
        ]}
      />
      <ReportTable columns={columns} data={data} loading={loading} error={error} />
    </div>
  );
}

export default OrderReports;

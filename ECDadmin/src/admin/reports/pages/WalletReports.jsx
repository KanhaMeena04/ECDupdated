import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import ReportTable from '../components/ReportTable';
import { useReports } from '../../api/reports';

function WalletReports() {
  const columns = ["User", "Wallet Amount", "Action"];
  const { reports, loading, error, fetchWalletReport } = useReports();

  useEffect(() => {
    fetchWalletReport({ page: 1, limit: 20 });
  }, [fetchWalletReport]);

  const data = reports.map(r => ({
    user: r.name,
    amount: `RM ${r.walletAmount?.toFixed(2) || '0.00'}`,
    action: '👁️'
  }));

  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Wallet Report"
        breadcrumbs={[
          { label: "Wallet Report" },
          { label: "Wallet Report", active: true }
        ]}
      />
      <ReportTable columns={columns} data={data} loading={loading} error={error} />
    </div>
  );
}

export default WalletReports;

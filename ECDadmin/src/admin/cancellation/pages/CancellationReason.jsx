import React from 'react';
import PageHeader from '../../components/PageHeader';
import PageActionBar from '../../components/PageActionBar';
import CancellationTable from '../components/CancellationTable';
import { useNavigate } from 'react-router-dom';

function CancellationReason() {
  const navigate = useNavigate();

  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Cancellation Reasons"
        breadcrumbs={[
          { label: "Cancellation Reasons" },
          { label: "List", active: true }
        ]}
      />

      <PageActionBar
        buttonLabel="Add Reason"
        onButtonClick={() => navigate("/add-reason")}
        searchLabel="Search"
        // searchValue={query}
        // onSearchChange={setQuery}
      />

      <CancellationTable />
    </div>
  );
}

export default CancellationReason;

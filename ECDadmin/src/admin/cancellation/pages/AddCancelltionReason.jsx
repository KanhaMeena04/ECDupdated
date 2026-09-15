import React from 'react';
import AddCancellationReasonForm from '../components/AddCancellationReasonForm';
import PageHeader from '../../components/PageHeader';

function AddCancellationReason() {
  return (
    <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Add Cancellation Reason"
        breadcrumbs={[
          { label: "Cancellation Reasons" },
          { label: "Add", active: true }
        ]}
      />


      <AddCancellationReasonForm />
    </div>
  );
}

export default AddCancellationReason;

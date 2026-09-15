import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditCancellationForm from '../components/EditCancellationForm'
function EditCancellation() {
  return (
	  <div className="w-full lg:mt-0 p-4 xs:p-5">
      <PageHeader
        title="Edit Cancellation Reason"
        breadcrumbs={[
          { label: "Edit Cancellation Reasons" },
          { label: "Cancellation", active: true }
        ]}
      />
	  <EditCancellationForm/>

    </div>
  )
}

export default EditCancellation
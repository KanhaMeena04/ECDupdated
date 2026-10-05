import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditRiderWrapper from '../components/EditRiderWrapper'

function EditRider() {
  return (
    <div className="w-full bg-white p-6 rounded-lg border">
      <PageHeader
        title="Edit Rider Profile"
        breadcrumbs={[
          { label: "Edit Rider Profile" },
          { label: "Edit Rider", active: true }
        ]}
      />
      <EditRiderWrapper/>
    </div>
  )
}

export default EditRider
import React from 'react'
import PageHeader from '../../components/PageHeader'
import CreateRiderWrapper from '../components/CreateRiderWrapper'

function AdminCreateRider() {
  return (
    <div className="w-full bg-white p-6 rounded-lg border">
      <PageHeader
        title="Create Rider"
        breadcrumbs={[
          { label: "Create Rider" },
          { label: "Rider", active: true }
        ]}
      />
      <CreateRiderWrapper/>
    </div>
  )
}

export default AdminCreateRider
import React from 'react'
import PageHeader from '../../components/PageHeader'
import UpdateLocationCard from '../components/LiveLocation'

function DriverLiveLocation() {
  return (
    <div className="w-full bg-white p-6 rounded-lg border">
      <PageHeader
        title="Rider Live Location"
        breadcrumbs={[
          { label: "Rider Live Location" },
          { label: "Rider", active: true }
        ]}
      />
      <UpdateLocationCard/>
    </div>
  )
}

export default DriverLiveLocation
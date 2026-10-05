import React from 'react'
import PageHeader from '../../components/PageHeader'
import RiderView from '../components/RiderView'

function DriverProfile() {
  return (
    <div className="w-full bg-white p-6 rounded-lg border">
      <PageHeader
        title="Rider Profile"
        breadcrumbs={[
          { label: "Rider Profile" },
          { label: "Rider", active: true }
        ]}
      />
      <RiderView/>
    </div>
  )
}

export default DriverProfile
import React from 'react'
import CityTable from '../components/CityTable'
import PageHeader from '../../components/PageHeader'

function CityList() {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
          <PageHeader
          title="Edit City"
          breadcrumbs={[
            { label: "Edit City" },
            { label: "City", active: true }
          ]}
          />
          <CityTable/>
      </div>
  )
}

export default CityList
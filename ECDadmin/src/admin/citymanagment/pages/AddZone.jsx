import React from 'react'
import PageHeader from '../../components/PageHeader'
import ZoneForm from '../components/ZoneForm'

function AddZone() {
  return (
	 <div className="p-6 bg-white rounded-xl border border-gray-200">
			  <PageHeader
			  title="Edit City"
			  breadcrumbs={[
				{ label: "Edit City" },
				{ label: "City", active: true }
			  ]}
			  />
			  <ZoneForm/>
		  </div>
  )
}

export default AddZone
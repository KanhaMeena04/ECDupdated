import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditCityForm from '../components/EditCityForm'

function EditCity() {
  return (
	<div className="p-6 bg-white rounded-xl border border-gray-200">
		  <PageHeader
			title="Edit City"
			breadcrumbs={[
			  { label: "Edit City" },
			  { label: "City", active: true }
			]}
		  />
		  <EditCityForm/>
	</div>
  )
}

export default EditCity
import React from 'react'
import PageHeader from '../../components/PageHeader'
import AddCityForm from '../components/CityForm'

function AddCity() {
  return (
	<div className="p-6 bg-white rounded-xl border border-gray-200">
		  <PageHeader
			title="Add City"
			breadcrumbs={[
			  { label: "Add City" },
			  { label: "City", active: true }
			]}
		  />
		  <AddCityForm/>
	</div>
  )
}

export default AddCity
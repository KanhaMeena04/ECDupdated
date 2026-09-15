import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditRiderWrapper from '../components/EditRiderWrapper'

function EditRider() {
  return (
	<div className="w-full bg-white p-6 rounded-lg border">
			   <PageHeader
							title="Edit Driver Profile"
							breadcrumbs={[
							  { label: "Edit Driver Profile" },
							  { label: "Edit Driver", active: true }
							]}
							/>
		 
			  <EditRiderWrapper/>
		  
		</div>
  )
}

export default EditRider
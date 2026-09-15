import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditAddonForm from '../components/EditAddonForm'

function EditAddon() {
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
	 <PageHeader
		title="Edit Addons List "
		breadcrumbs={[
		  { label: "Addons" },
		  { label: "Edit Addons List", active: true }
		]}
		/>
		<EditAddonForm/>
		
	</div>
  )
}

export default EditAddon
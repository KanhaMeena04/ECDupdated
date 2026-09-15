import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditGroupForm from '../components/EditGroupForm'

function EditGroup() {
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
			 <PageHeader
				title="Edit Group Tags"
				breadcrumbs={[
				  { label: "Group" },
				  { label: "Edit Group Tags", active: true }
				]}
				/>
				  <EditGroupForm/>
	
				</div>
  )
}

export default EditGroup
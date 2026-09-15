import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditGroupTagForm from '../components/EditGroupTagForm'

function EditGroupTag() {
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
			 <PageHeader
				title="Edit Group Tags"
				breadcrumbs={[
				  { label: "Group" },
				  { label: "Edit Group Tags", active: true }
				]}
				/>
				  <EditGroupTagForm/>
	
				</div>
  )
}

export default EditGroupTag
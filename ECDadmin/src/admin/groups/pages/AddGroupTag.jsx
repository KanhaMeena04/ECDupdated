import React from 'react'
import PageHeader from '../../components/PageHeader'
import GroupTagForm from '../components/GroupTagForm'
function AddGroupTag() {
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
		 <PageHeader
			title="Tags "
			breadcrumbs={[
			  { label: "Tags List" },
			  { label: "Add Tags", active: true }
			]}
			/>
			 <GroupTagForm/>
			</div>
  )
}

export default AddGroupTag
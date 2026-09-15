import React from 'react'
import PageActionBar from '../../components/PageActionBar'
import PageHeader from '../../components/PageHeader'
import AddGroupForm from '../components/AddGroupForm'
function AddGroups() {
  return (
		<div className="p-6 bg-gray-50 min-h-screen">
	 <PageHeader
		title="Groups "
		breadcrumbs={[
		  { label: "Groups" },
		  { label: "Add Groups", active: true }
		]}
		/>
		  
			<AddGroupForm/>
		</div>
  )
}

export default AddGroups
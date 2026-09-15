import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditTagForm from '../components/EditTagForm'

function EditTag() {
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
			<PageHeader
		  title="Tags"
		  breadcrumbs={[
			{ label: "Tags" },
			{ label: "Tags List", active: true }
		  ]}
		/>
		<EditTagForm/>
		
		
	
		  
		
		</div>
  )
}

export default EditTag
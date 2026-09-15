import React from 'react'
import PageHeader from '../../components/PageHeader'
import AddTagForm from '../components/AddTagForm'
function AddTag() {
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
			<PageHeader
		  title="Tags "
		  breadcrumbs={[
			{ label: "Tags Add" },
			{ label: "Add Tags", active: true }
		  ]}
		/>
		<AddTagForm/>
		
		</div>
  )
}

export default AddTag
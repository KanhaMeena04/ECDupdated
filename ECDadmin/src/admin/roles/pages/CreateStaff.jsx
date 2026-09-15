import React from 'react'
import PageHeader from '../../components/PageHeader'
import CreateStaffForm from '../components/CreateStaffForm'
function CreateStaff() {
  return (
	 <div className="w-full  lg:mt-0 p-4 xs:p-5">
		<PageHeader
	  title="Create Staff"
	  breadcrumbs={[
		{ label: "Roles" },
		{ label: "Create Saff", active: true }
	  ]}
	/>
	<CreateStaffForm/>
	  
	</div>
  )
}

export default CreateStaff
import React from 'react'
import PageHeader from '../../components/PageHeader'
import CreateRoleForm from '../components/CreateRoleForm'
function CreateRole() {
  return (
	 <div className="w-full  lg:mt-0 p-4 xs:p-5">
		<PageHeader
	  title="Create Role"
	  breadcrumbs={[
		{ label: "Roles" },
		{ label: "Create Role", active: true }
	  ]}
	/>
	
	<CreateRoleForm/>	
	  
	</div>
  )
}

export default CreateRole
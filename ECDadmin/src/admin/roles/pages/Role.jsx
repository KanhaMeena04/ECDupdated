import React from 'react'
import PageHeader from '../../components/PageHeader'
import RoleListTable from '../components/RoleListTable'
function Role() {
  return (
	 <div className="w-full  lg:mt-0 p-4 xs:p-5">
		<PageHeader
	  title="Roles List"
	  breadcrumbs={[
		{ label: "Roles" },
		{ label: "Roles List", active: true }
	  ]}
	/>
	
		
		<RoleListTable/>	
	  
	</div>
  )
}

export default Role
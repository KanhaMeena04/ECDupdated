import React from 'react'
import PageHeader from '../../components/PageHeader'
import StaffTable from '../components/StaffTable'
function Staff() {
  return (
	 <div className="w-full  lg:mt-0 p-4 xs:p-5">
		<PageHeader
	  title="Admins List"
	  breadcrumbs={[
		{ label: "Admins" },
		{ label: "Admins List", active: true }
	  ]}
	/>
	
		
	  <StaffTable/>
	</div>
  )
}

export default Staff